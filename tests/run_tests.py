import sys
import unittest
import io

sys.path.insert(0, './tests')
import test_error_pipeline

suite = unittest.TestLoader().loadTestsFromModule(test_error_pipeline)
stream = io.StringIO()
runner = unittest.TextTestRunner(stream=stream, verbosity=2)
result = runner.run(suite)

# Write output to file strictly as utf-8
with open('tests_full_output.txt', 'w', encoding='utf-8') as f:
    f.write(stream.getvalue())
    if not result.wasSuccessful():
        f.write("\n=== FAILURES / ERRORS ===\n")
        f.write(str(result.errors) + "\n")
        f.write(str(result.failures) + "\n")

if not result.wasSuccessful():
    sys.exit(1)
