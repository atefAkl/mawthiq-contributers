<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:4', 'max:32'],
            'parent_id' => ['nullable', 'exists:accounts,id'],
            'type' => ['boolean'],
            'details' => ['nullable', 'string', 'min:10', 'max:255'],
        ];
    }
}
