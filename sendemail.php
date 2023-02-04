<?php

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = $_POST["name"];
  $email = $_POST["email"];
  $message = $_POST["message"];

  $to = "giacomo.garetto@gmail.com";
  $subject = "New Contact Form Submission";
  $headers = "From: " . $email . "\r\n";
  $headers .= "Reply-To: " . $email . "\r\n";
  $headers .= "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

  $email_body = "You have received a new message from the contact form on your website.\n\n" .
                "Name: " . $name . "\n" .
                "Email: " . $email . "\n" .
                "Message: " . $message . "\n";

  mail($to, $subject, $email_body, $headers);
}

?>
