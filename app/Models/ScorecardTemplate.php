<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScorecardTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'position',
        'total_max_score',
        'questions',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'total_max_score' => 'float',
        'questions' => 'array',
        'is_active' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class, 'scorecard_template_id');
    }
}
