<?php
if (!isset($_GET['cpf'])) {
    echo json_encode(["error" => "CPF não informado"]);
    exit;
}

$cpf = $_GET['cpf'];
$api_url = "https://apela-tech.com?user=ab34229f-cd38-4621-97a9-6c1c7cbd354b&cpf=" . urlencode($cpf);

$response = file_get_contents($api_url);

if ($response === false) {
    echo json_encode(["error" => "Erro ao acessar a API externa"]);
    exit;
}

header('Content-Type: application/json');
echo $response;
?>
