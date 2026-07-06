from .base import *

import os
import sys

if "test" in sys.argv or "test_coverage" in sys.argv:
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
    
    DATABASES["mongo"] = {
        "ENGINE": "django.db.backends.dummy",
    }