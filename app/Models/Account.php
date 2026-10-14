<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = [
        'name',
        'parent_id',
        'type',
        'details',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => 'boolean',
        ];
    }
}
