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
    
    # Configure throttle rates for rate limiting tests
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["login"] = "4/min"
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["register"] = "2/min"