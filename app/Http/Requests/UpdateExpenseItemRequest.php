<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseItemRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'min:4', 'max:32'],
            'description' => ['nullable', 'string', 'min:10', 'max:255'],
            'category_id' => ['sometimes', 'exists:expense_categories,id'],
            'amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
