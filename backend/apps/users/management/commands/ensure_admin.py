import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create a Django superuser for /admin/ if one does not already exist."

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@wamdh.app")

        if not password:
            self.stderr.write(
                self.style.WARNING(
                    "[ensure_admin] DJANGO_SUPERUSER_PASSWORD is not set — skipping superuser creation."
                )
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.SUCCESS(
                    f"[ensure_admin] Superuser '{username}' already exists — nothing to do."
                )
            )
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(
            self.style.SUCCESS(
                f"[ensure_admin] Superuser '{username}' created successfully."
            )
        )
