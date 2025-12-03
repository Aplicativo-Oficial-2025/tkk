<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (isset($_GET['cpf'])) {
    $cpf = htmlspecialchars($_GET['cpf']); 
    $endpoint = "";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPGET, true);

    $response = curl_exec($ch);

   
    if (curl_errno($ch)) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao conectar com o endpoint externo"]);
        curl_close($ch);
        exit();
    }

    curl_close($ch);


    header('Content-Type: application/json');
    echo $response;
} else {

    http_response_code(400);
    echo json_encode(["error" => "CPF não fornecido"]);
}
