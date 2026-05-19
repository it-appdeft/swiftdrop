<?php

namespace App\Exceptions;

class ResourceNotFoundException extends ApiException
{
    public static function for(string $resource, string $field = 'id'): self
    {
        return new self(
            message: "{$resource} not found.",
            status: 404,
            field: $field,
        );
    }
}
