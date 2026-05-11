def run_fake_diagnostic(job):
    test_request = job.request
    test_suite = job.test_suite
    suite_name = test_suite.name if test_suite else "Generic Diagnostic"
    target_serial = test_request.target_serial if test_request else "UNKNOWN"
    failed = "FAIL" in target_serial.upper()

    logs = [
        {
            "level": "INFO",
            "message": f"Starting {suite_name} for target {target_serial}",
        },
        {
            "level": "INFO",
            "message": f"Initializing lab station {job.lab_station}",
        },
        {
            "level": "INFO",
            "message": f"Loading diagnostic suite {suite_name}",
        },
    ]

    checks = _checks_for_suite(suite_name, failed)
    logs.extend(checks["logs"])

    if failed:
        result = {
            "result_status": "FAILED",
            "summary": checks["failure_summary"],
            "failed_step": checks["failed_step"],
            "error_code": checks["error_code"],
            "recommendation": checks["recommendation"],
        }
        final_status = "FAILED"
    else:
        logs.append(
            {
                "level": "INFO",
                "message": "Diagnostic completed successfully",
            }
        )
        result = {
            "result_status": "PASSED",
            "summary": checks["success_summary"],
            "failed_step": None,
            "error_code": None,
            "recommendation": None,
        }
        final_status = "PASSED"

    return {"final_status": final_status, "logs": logs, "result": result}


def _checks_for_suite(suite_name, failed):
    suite_key = suite_name.lower()

    if "memory" in suite_key:
        return _memory_checks(failed)
    if "power" in suite_key:
        return _power_checks(failed)
    if "thermal" in suite_key:
        return _thermal_checks(failed)
    if "firmware" in suite_key:
        return _firmware_checks(failed)
    if "full board" in suite_key:
        return _full_board_checks(failed)

    return _generic_checks(failed)


def _memory_checks(failed):
    logs = [
        {"level": "INFO", "message": "Running memory channel validation"},
        {"level": "INFO", "message": "Running stress pattern validation"},
    ]
    if failed:
        logs.extend(
            [
                {
                    "level": "ERROR",
                    "message": "ECC validation failed on memory channel 2",
                },
                {
                    "level": "ERROR",
                    "message": "Diagnostic failed with error code ECC_102",
                },
            ]
        )
    return {
        "logs": logs,
        "success_summary": "Memory diagnostic completed successfully.",
        "failure_summary": "Memory diagnostic failed during ECC validation.",
        "failed_step": "ECC validation",
        "error_code": "ECC_102",
        "recommendation": "Inspect memory channel 2 and rerun the diagnostic.",
    }


def _power_checks(failed):
    logs = [
        {"level": "INFO", "message": "Measuring idle voltage rails"},
        {"level": "INFO", "message": "Applying transient load profile"},
    ]
    if failed:
        logs.extend(
            [
                {"level": "ERROR", "message": "Voltage droop exceeded tolerance"},
                {
                    "level": "ERROR",
                    "message": "Diagnostic failed with error code PWR_221",
                },
            ]
        )
    return {
        "logs": logs,
        "success_summary": "Power stability test completed successfully.",
        "failure_summary": "Power stability test failed during load transient.",
        "failed_step": "Transient load validation",
        "error_code": "PWR_221",
        "recommendation": "Review regulator telemetry and power delivery changes.",
    }


def _thermal_checks(failed):
    logs = [
        {"level": "INFO", "message": "Reading baseline thermal sensors"},
        {"level": "INFO", "message": "Running sustained thermal stress workload"},
    ]
    if failed:
        logs.extend(
            [
                {"level": "ERROR", "message": "Thermal sensor exceeded limit"},
                {
                    "level": "ERROR",
                    "message": "Diagnostic failed with error code THM_310",
                },
            ]
        )
    return {
        "logs": logs,
        "success_summary": "Thermal stress test completed successfully.",
        "failure_summary": "Thermal stress test failed due to over-temperature.",
        "failed_step": "Sustained thermal stress",
        "error_code": "THM_310",
        "recommendation": "Check cooling contact, airflow, and thermal sensor logs.",
    }


def _firmware_checks(failed):
    logs = [
        {"level": "INFO", "message": "Checking firmware image metadata"},
        {"level": "INFO", "message": "Running firmware command response checks"},
    ]
    if failed:
        logs.extend(
            [
                {"level": "ERROR", "message": "Firmware command timeout detected"},
                {
                    "level": "ERROR",
                    "message": "Diagnostic failed with error code FW_044",
                },
            ]
        )
    return {
        "logs": logs,
        "success_summary": "Firmware validation completed successfully.",
        "failure_summary": "Firmware validation failed due to command timeout.",
        "failed_step": "Firmware command response",
        "error_code": "FW_044",
        "recommendation": "Reflash firmware and verify command interface stability.",
    }


def _full_board_checks(failed):
    logs = [
        {"level": "INFO", "message": "Running board connectivity checks"},
        {"level": "INFO", "message": "Running integrated subsystem checks"},
    ]
    if failed:
        logs.extend(
            [
                {"level": "ERROR", "message": "Subsystem handshake failed"},
                {
                    "level": "ERROR",
                    "message": "Diagnostic failed with error code BRD_500",
                },
            ]
        )
    return {
        "logs": logs,
        "success_summary": "Full board diagnostic completed successfully.",
        "failure_summary": "Full board diagnostic failed during subsystem checks.",
        "failed_step": "Integrated subsystem validation",
        "error_code": "BRD_500",
        "recommendation": "Inspect board interconnects and subsystem telemetry.",
    }


def _generic_checks(failed):
    logs = [
        {"level": "INFO", "message": "Running diagnostic pre-checks"},
        {"level": "INFO", "message": "Running diagnostic validation sequence"},
    ]
    if failed:
        logs.extend(
            [
                {"level": "ERROR", "message": "Diagnostic validation failed"},
                {
                    "level": "ERROR",
                    "message": "Diagnostic failed with error code DIAG_001",
                },
            ]
        )
    return {
        "logs": logs,
        "success_summary": "Diagnostic completed successfully.",
        "failure_summary": "Diagnostic failed during validation.",
        "failed_step": "Diagnostic validation",
        "error_code": "DIAG_001",
        "recommendation": "Review generated logs and rerun after investigation.",
    }
