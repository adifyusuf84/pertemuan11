<?php
function sendResponse($statusCode, $success, $message, $data = null) {
    http_response_code($statusCode);
    $response = [
        'success' => $success,
        'message' => $message,
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function sendSuccess($message, $data = null, $statusCode = 200) {
    sendResponse($statusCode, true, $message, $data);
}

function sendError($message, $statusCode = 400, $data = null) {
    sendResponse($statusCode, false, $message, $data);
}

function validateInput($data, $rules) {
    $errors = [];
    foreach ($rules as $field => $rule) {
        $ruleList = explode('|', $rule);
        foreach ($ruleList as $r) {
            if ($r === 'required') {
                if (!isset($data[$field]) || trim($data[$field]) === '') {
                    $errors[$field] = "Field '$field' wajib diisi.";
                    break;
                }
            }
            if ($r === 'numeric' && isset($data[$field]) && $data[$field] !== '') {
                if (!is_numeric($data[$field])) {
                    $errors[$field] = "Field '$field' harus berupa angka.";
                    break;
                }
            }
            if (strpos($r, 'max:') === 0 && isset($data[$field])) {
                $max = (int) substr($r, 4);
                if (strlen($data[$field]) > $max) {
                    $errors[$field] = "Field '$field' maksimal $max karakter.";
                    break;
                }
            }
            if (strpos($r, 'min:') === 0 && isset($data[$field]) && $data[$field] !== '') {
                $min = (int) substr($r, 4);
                if ((int)$data[$field] < $min) {
                    $errors[$field] = "Field '$field' minimal $min.";
                    break;
                }
            }
        }
    }
    return $errors;
}
?>
