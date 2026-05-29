<?php

namespace App\Exceptions;

class InvalidInputException extends ApiException
{
    public static function make(string $message, string $field = 'error'): self
    {
        return new self(
            message: $message,
            status: 422,
            field: $field,
        );
    }
}
