import ast
import re
from pathlib import Path

DANGEROUS_FUNCTIONS = {
    "gets": "Replace gets() with fgets() or getline() to avoid buffer overflow.",
    "strcpy": "Use strncpy or strlcpy with explicit buffer length.",
    "sprintf": "Switch to snprintf and limit the destination buffer.",
    "memcpy": "Validate destination buffer size before calling memcpy.",
}


def _detect_malloc_without_free(code: str) -> bool:
    return "malloc" in code and "free" not in code


def _find_dangerous_calls(code: str):
    findings = []
    lines = code.splitlines()
    for idx, line in enumerate(lines):
        for func in DANGEROUS_FUNCTIONS:
            if re.search(rf"{func}\s*\\(", line):
                findings.append(
                    {
                        "line": idx + 1,
                        "issue": f"Unsafe call to {func} detected",
                        "fix": DANGEROUS_FUNCTIONS[func],
                    }
                )
    return findings


def _python_specific_findings(code: str):
    findings = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return findings

    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append(
                {
                    "line": node.lineno,
                    "issue": "Bare except detected",
                    "fix": "Catch a specific exception or re-raise the original error.",
                }
            )
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "eval":
            findings.append(
                {
                    "line": node.lineno,
                    "issue": "Use of eval() is unsafe",
                    "fix": "Avoid eval(); use ast.literal_eval or a safe parser.",
                }
            )
    return findings


def _apply_quick_fixes(code: str) -> str:
    fixed = code.replace("gets(", "fgets(")
    fixed = fixed.replace("strcpy(", "strncpy(")
    fixed = fixed.replace("sprintf(", "snprintf(")
    return fixed


def correct_code(filepath: str) -> dict:
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Code file not found: {filepath}")

    code = path.read_text(encoding="utf-8", errors="ignore")

    findings = []
    if _detect_malloc_without_free(code):
        findings.append(
            {
                "line": 0,
                "issue": "malloc detected without matching free()",
                "fix": "Ensure every allocation is paired with a free() before returning.",
            }
        )

    findings.extend(_find_dangerous_calls(code))
    findings.extend(_python_specific_findings(code))

    fixed_code = _apply_quick_fixes(code)

    return {
        "issuesFound": len(findings),
        "corrections": findings,
        "fixedCode": fixed_code,
    }