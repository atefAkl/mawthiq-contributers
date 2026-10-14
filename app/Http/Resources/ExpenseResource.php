<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'description' => $this->description,
            'date' => $this->date ? $this->date->format('Y-m-d') : null,
            'related_party_id' => $this->related_party_id,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ];
            }),
            'related_party' => $this->whenLoaded('relatedParty', function () {
                return [
                    'id' => $this->relatedParty->id,
                    'name' => $this->relatedParty->name,
                ];
            }),
            'recorded_by' => $this->whenLoaded('recorder', function () {
                return [
                    'id' => $this->recorder->id,
                    'name' => $this->recorder->name,
                ];
            }),
            'created_at' => $this->created_at,
        ];
    }
}
