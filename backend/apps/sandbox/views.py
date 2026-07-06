import datetime
import hashlib
import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from config.mongodb import db, clean_doc, clean_docs, get_object_id

JUDGE0_API_URL = "https://ce.judge0.com"  # Free tier
JUDGE0_HEADERS = {"Content-Type": "application/json"}

LANGUAGE_IDS = {
    "javascript": 93,
    "typescript": 94,
    "python": 92, # Python 3.11.2
    "java": 91,
    "cpp": 105,
    "c": 104,
    "sql": 82,
    "go": 95,
    "rust": 73,
    "ruby": 72,
    "php": 98,
    "swift": 81,
    "kotlin": 78,
    "html": 92,
    "css": 92,
}

LANGUAGE_TIMEOUTS = {
    "javascript": 5, "typescript": 5, "python": 10,
    "java": 15, "cpp": 10, "c": 10, "sql": 5,
    "go": 10, "rust": 15, "ruby": 10, "php": 10,
    "swift": 15, "kotlin": 15, "html": 3, "css": 3,
}


def get_cache_key(code: str, language: str, stdin: str) -> str:
    content = f"{language}:{code}:{stdin}"
    return f"sandbox:{hashlib.md5(content.encode()).hexdigest()}"


def normalize_python(code: str, stdin: str) -> tuple:
    # Python doesn't need stdin mocking since Judge0 passes stdin correctly
    return code, stdin


def normalize_java(code: str) -> str:
    if 'public class' not in code:
        return f'public class Main {{\n{code}\n}}'
    return code


def normalize_cpp(code: str, stdin: str) -> str:
    if '#include' not in code:
        code = '#include <iostream>\nusing namespace std;\n' + code
    return code


CHALLENGE_TESTS = {
    "1": lambda stdout: "28" in stdout, # Array Sum
    "2": lambda stdout: "3" in stdout or "4" in stdout or "2" in stdout, # Text counter
    "3": lambda stdout: any(x in stdout for x in ["34", "21", "55"]), # Fibonacci
    "4": lambda stdout: any(x in stdout.lower() for x in ["true", "prime", "yes"]), # Prime Checker
    "5": lambda stdout: any(x in stdout.lower() for x in ["xp", "select", "student"]), # SQL
    "6": lambda stdout: any(x in stdout.lower() for x in ["hello", "server", "http"]), # Go
    "7": lambda stdout: any(x in stdout.lower() for x in ["rust", "owner", "borrow"]), # Rust
    "8": lambda stdout: any(x in stdout.lower() for x in ["calculator", "sum", "result", "5"]), # Swift
}


class CodeExecuteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        code = request.data.get("code", "")
        language = request.data.get("language", "javascript")
        stdin = request.data.get("stdin", "")
        challenge_id = request.data.get("challenge_id")

        if not code:
            return Response({"error": "Code is required"}, status=status.HTTP_400_BAD_REQUEST)

        # HTML/CSS direct bypass
        if language in ["html", "css"]:
            response_data = {
                "stdout": code,
                "stderr": None,
                "status": "Accepted",
                "time": "0.0",
                "memory": "0",
            }
            # Trigger stats tracking for achievements
            try:
                from apps.analytics.achievements_engine import track_user_action
                track_user_action(request.user.id, "code_runs")
                track_user_action(request.user.id, "languages_used", value=language)
            except Exception as e:
                print(f"Error triggering achievements: {e}")
            return Response(response_data, status=status.HTTP_200_OK)

        lang_id = LANGUAGE_IDS.get(language, 93)
        timeout = LANGUAGE_TIMEOUTS.get(language, 10)

        cache_key = get_cache_key(code, language, stdin)
        cached = cache.get(cache_key)
        if cached:
            return Response(cached, status=status.HTTP_200_OK)

        normalized_code = code
        if language == "python":
            normalized_code, stdin = normalize_python(code, stdin)
        elif language == "java":
            normalized_code = normalize_java(code)
        elif language in ["cpp", "c"]:
            normalized_code = normalize_cpp(code, stdin)

        payload = {
            "source_code": normalized_code,
            "language_id": lang_id,
            "stdin": stdin,
        }

        try:
            submit_url = f"{JUDGE0_API_URL}/submissions"
            submit_params = {"base64_encoded": "false", "wait": "true"}

            resp = requests.post(
                submit_url,
                json=payload,
                params=submit_params,
                headers=JUDGE0_HEADERS,
                timeout=timeout + 5
            )

            if resp.status_code != 201:
                return Response({"error": f"Judge0 error: {resp.text}"}, status=status.HTTP_502_BAD_GATEWAY)

            result = resp.json()
            stdout = result.get("stdout", "") or result.get("compile_output", "")
            stderr = result.get("stderr", "")
            status_msg = result.get("status", {}).get("description", "Unknown")
            stderr_msg = result.get("stderr", "") or result.get("compile_output", "")

            output = stdout if stdout else stderr_msg if stderr_msg else status_msg

            response_data = {
                "stdout": output,
                "stderr": stderr_msg if stderr_msg else None,
                "status": status_msg,
                "time": result.get("time"),
                "memory": result.get("memory"),
            }

            # Trigger stats tracking for achievements
            try:
                from apps.analytics.achievements_engine import track_user_action
                track_user_action(request.user.id, "code_runs")
                track_user_action(request.user.id, "languages_used", value=language)
                
                # Check challenge completion
                if challenge_id and challenge_id in CHALLENGE_TESTS:
                    test_fn = CHALLENGE_TESTS[challenge_id]
                    if test_fn(output):
                        track_user_action(request.user.id, "challenges_solved")
                        # Award 100 bonus XP for completing coding challenge
                        user = request.user
                        user.xp_points += 100
                        user.save()
                        
                        from config.mongodb import users_col
                        users_col.update_one(
                            {"username": user.username},
                            {"$set": {"xp_points": user.xp_points}}
                        )
                        response_data["challenge_completed"] = True
            except Exception as e:
                print(f"Error triggering achievements: {e}")

            cache.set(cache_key, response_data, timeout=3600)
            return Response(response_data, status=status.HTTP_200_OK)

        except requests.RequestException as e:
            return Response({"error": f"Execution failed: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


class CodeTemplatesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        language = request.query_params.get("language", "javascript")
        templates = {
            "javascript": {
                "title": "Array Sum Calculator",
                "code": "function sumArray(arr) {\n  return arr.reduce((a, b) => a + b, 0);\n}\n\nconsole.log(sumArray([1, 2, 3, 4, 5]));"
            },
            "python": {
                "title": "Fibonacci Sequence",
                "code": "def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a)\n        a, b = b, a + b\n\nfibonacci(10)"
            },
            "java": {
                "title": "Hello World",
                "code": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
            },
            "cpp": {
                "title": "Number Checker",
                "code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    cout << (n % 2 == 0 ? \"Even\" : \"Odd\") << endl;\n    return 0;\n}"
            }
        }
        return Response(templates.get(language, templates["javascript"]))


class LanguageListView(APIView):
    def get(self, request, *args, **kwargs):
        languages = [
            {"id": "javascript", "name": "JavaScript", "version": "Node.js 18", "icon": "logo-javascript"},
            {"id": "typescript", "name": "TypeScript", "version": "Node.js 18", "icon": "code-slash"},
            {"id": "python", "name": "Python", "version": "3.11", "icon": "terminal-outline"},
            {"id": "java", "name": "Java", "version": "JDK 17", "icon": "cafe-outline"},
            {"id": "cpp", "name": "C++", "version": "GCC 14", "icon": "code-working-outline"},
            {"id": "c", "name": "C", "version": "GCC 14", "icon": "code-working-outline"},
            {"id": "sql", "name": "SQL", "version": "SQLite", "icon": "server-outline"},
            {"id": "go", "name": "Go", "version": "1.21", "icon": "rocket-outline"},
            {"id": "rust", "name": "Rust", "version": "1.70", "icon": "hardware-chip-outline"},
            {"id": "ruby", "name": "Ruby", "version": "3.0", "icon": "diamond-outline"},
            {"id": "php", "name": "PHP", "version": "8.2", "icon": "logo-php"},
            {"id": "swift", "name": "Swift", "version": "5.9", "icon": "swift-outline"},
            {"id": "kotlin", "name": "Kotlin", "version": "1.9", "icon": "bug-outline"},
            {"id": "html", "name": "HTML/CSS", "version": "Browser", "icon": "globe-outline"},
        ]
        return Response(languages)