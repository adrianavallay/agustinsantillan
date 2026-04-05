<?php
header('Content-Type: application/json; charset=utf-8');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false]));
}

// ── Collect & sanitize ────────────────────────────
$firstname = trim(strip_tags($_POST['firstname'] ?? ''));
$lastname  = trim(strip_tags($_POST['lastname']  ?? ''));
$email     = trim($_POST['email']   ?? '');
$phone     = trim(strip_tags($_POST['phone']   ?? ''));
$message   = trim(strip_tags($_POST['message'] ?? ''));

if (!$firstname || !$email || !$message) {
    http_response_code(400);
    exit(json_encode(['ok' => false]));
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit(json_encode(['ok' => false]));
}

// ── SMTP config ───────────────────────────────────
$smtp_host = 'c1611950.ferozo.com';
$smtp_port = 465;
$smtp_user = 'hola@agustinsantillan.com';
$smtp_pass = 'Agustin2304@';
$mail_to   = 'hola@agustinsantillan.com';

// ── Build email ───────────────────────────────────
$name    = $lastname ? "$firstname $lastname" : $firstname;
$subject = "Web Contact: $name";

$body  = "Name:    $name\r\n";
$body .= "Email:   $email\r\n";
if ($phone) $body .= "Phone:   $phone\r\n";
$body .= "\r\nMessage:\r\n$message\r\n";

// ── SMTP helper ───────────────────────────────────
function smtp_read($sock) {
    $out = '';
    while ($line = fgets($sock, 512)) {
        $out .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') break;
    }
    return $out;
}

function smtp_ok($response, $expected) {
    return strpos($response, $expected) === 0;
}

function smtp_send($host, $port, $user, $pass, $from, $to,
                   $reply_email, $reply_name, $subject, $body) {

    $ctx = stream_context_create(['ssl' => [
        'verify_peer'       => false,
        'verify_peer_name'  => false,
        'allow_self_signed' => true,
    ]]);

    $sock = @stream_socket_client(
        "ssl://$host:$port", $errno, $errstr, 15,
        STREAM_CLIENT_CONNECT, $ctx
    );
    if (!$sock) return false;

    if (!smtp_ok(smtp_read($sock), '220')) { fclose($sock); return false; }

    fwrite($sock, "EHLO localhost\r\n");
    if (!smtp_ok(smtp_read($sock), '250')) { fclose($sock); return false; }

    fwrite($sock, "AUTH LOGIN\r\n");
    if (!smtp_ok(smtp_read($sock), '334')) { fclose($sock); return false; }

    fwrite($sock, base64_encode($user) . "\r\n");
    if (!smtp_ok(smtp_read($sock), '334')) { fclose($sock); return false; }

    fwrite($sock, base64_encode($pass) . "\r\n");
    if (!smtp_ok(smtp_read($sock), '235')) { fclose($sock); return false; }

    fwrite($sock, "MAIL FROM:<$from>\r\n");
    if (!smtp_ok(smtp_read($sock), '250')) { fclose($sock); return false; }

    fwrite($sock, "RCPT TO:<$to>\r\n");
    if (!smtp_ok(smtp_read($sock), '250')) { fclose($sock); return false; }

    fwrite($sock, "DATA\r\n");
    if (!smtp_ok(smtp_read($sock), '354')) { fclose($sock); return false; }

    $safe_name    = mb_encode_mimeheader($reply_name, 'UTF-8', 'B');
    $safe_subject = mb_encode_mimeheader($subject,    'UTF-8', 'B');

    $headers  = "Date: " . date('r') . "\r\n";
    $headers .= "From: Santillan Design <$from>\r\n";
    $headers .= "Reply-To: $safe_name <$reply_email>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Subject: $safe_subject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: quoted-printable\r\n";

    fwrite($sock, $headers . "\r\n" . quoted_printable_encode($body) . "\r\n.\r\n");
    if (!smtp_ok(smtp_read($sock), '250')) { fclose($sock); return false; }

    fwrite($sock, "QUIT\r\n");
    fclose($sock);
    return true;
}

$ok = smtp_send(
    $smtp_host, $smtp_port, $smtp_user, $smtp_pass,
    $smtp_user, $mail_to,
    $email, $name,
    $subject, $body
);

echo json_encode(['ok' => $ok]);
