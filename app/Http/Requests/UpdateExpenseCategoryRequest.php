<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:4', 'max:32'],
            'description' => ['nullable', 'string', 'min:10', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'active' => ['boolean'],
            'category_id' => ['nullable', 'exists:expense_categories,id'],
        ];
    }
}
