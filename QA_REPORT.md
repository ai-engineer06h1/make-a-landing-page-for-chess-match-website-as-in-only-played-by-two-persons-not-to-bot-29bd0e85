# A6 QA Report

## Summary

3 passed, 2 failed (17 finding(s)), 0 skipped, 0 errored

## Dependency Vulnerabilities — FAIL

- **medium** `package.json` — react-router-dom: moderate severity vulnerability
- **medium** `package.json` — react-router: moderate severity vulnerability

## Static Vulnerabilities — PASS

No findings.

## Hardcoded Secrets — PASS

No findings.

## Dead Code — FAIL

- **low** `api/index.py` — unused function 'create_game' (60% confidence)
- **low** `api/index.py` — unused function 'end_game' (60% confidence)
- **low** `api/index.py` — unused function 'game_status' (60% confidence)
- **low** `api/index.py` — unused function 'join_game' (60% confidence)
- **low** `api/index.py` — unused function 'move' (60% confidence)
- **low** `api/index.py` — unused import 'Dict' (90% confidence)
- **low** `api/index.py` — unused import 'os' (90% confidence)
- **low** `api/index.py` — unused variable 'board' (60% confidence)
- **low** `api/index.py` — unused variable 'board' (60% confidence)
- **low** `api/index.py` — unused variable 'message' (60% confidence)
- **low** `api/index.py` — unused variable 'message' (60% confidence)
- **low** `api/index.py` — unused variable 'message' (60% confidence)
- **low** `api/index.py` — unused variable 'move' (60% confidence)
- **low** `api/index.py` — unused variable 'players' (60% confidence)
- **low** `api/index.py` — unused variable 'status' (60% confidence)

## Functional / Input Validation — PASS

No findings.
