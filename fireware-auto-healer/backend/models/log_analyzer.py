import re
from collections import Counter
from pathlib import Path

ERROR_PATTERNS = {
    "memory": [
        r"out of memory",
        r"alloc(ation)? failed",
        r"memory leak",
        r"segmentation fault",
    ],
    "io": [
        r"io error",
        r"disk full",
        r"permission denied",
        r"device busy",
    ],
    "network": [
        r"timeout",
        r"connection reset",
        r"dns",
        r"unreachable",
    ],
    "boot": [
        r"bootloader",
        r"firmware",
        r"panic",
        r"watchdog",
    ],
}

FIX_SUGGESTIONS = {
    "memory": "Increase heap/stack allocation and enable leak detection in the bootloader configuration.",
    "io": "Check storage health, free disk space, and verify the process user has the right permissions.",
    "network": "Validate connectivity to dependent services, update DNS, and increase timeout thresholds.",
    "boot": "Reflash the boot partition with the latest firmware and reset the watchdog configuration.",
    "generic": "Review the failing module logs and rerun the scenario with verbose instrumentation enabled.",
}


def _detect_category(line: str) -> str:
    lower = line.lower()
    for category, patterns in ERROR_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                return category
    return "generic"


def _build_reproduction_steps(category: str, last_error: str) -> list:
    base_steps = [
        "Collect full log output with DEBUG verbosity enabled.",
        "Restart the service with instrumentation and reproduce the failing workflow.",
        f"Capture system metrics (CPU, memory, IO) while the issue manifests ({category}).",
    ]

    if category == "memory":
        base_steps.insert(
            1,
            "Use a leak detector (valgrind/asan) while running the firmware update sequence.",
        )
    elif category == "network":
        base_steps.insert(
            1,
            "Simulate degraded network conditions with tc/netem to reproduce the timeout.",
        )
    elif category == "boot":
        base_steps.insert(
            1,
            "Flash the previous known-good image, then apply the latest firmware to observe the boot panic.",
        )

    base_steps.append(f"Verify the failing log line: \"{last_error.strip()}\".")
    return base_steps


def analyze_log(filepath: str) -> dict:
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Log file not found: {filepath}")

    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    error_lines = [line for line in lines if "error" in line.lower() or "panic" in line.lower()]

    if not error_lines:
        return {
            "rootCause": "No critical errors detected in the provided log.",
            "reproductionSteps": [
                "Increase log verbosity to DEBUG.",
                "Reproduce the scenario and re-upload the latest log bundle.",
            ],
            "suggestedFix": FIX_SUGGESTIONS["generic"],
            "confidence": 45,
        }

    categories = [_detect_category(line) for line in error_lines]
    category_counts = Counter(categories)
    dominant_category = category_counts.most_common(1)[0][0]

    last_error = error_lines[-1]
    root_cause = f"{dominant_category.capitalize()} issue detected based on '{last_error.strip()[:120]}'"
    steps = _build_reproduction_steps(dominant_category, last_error)
    suggestion = FIX_SUGGESTIONS.get(dominant_category, FIX_SUGGESTIONS["generic"])
    confidence = min(99, 60 + category_counts[dominant_category] * 5)

    return {
        "rootCause": root_cause,
        "reproductionSteps": steps,
        "suggestedFix": suggestion,
        "confidence": confidence,
    }