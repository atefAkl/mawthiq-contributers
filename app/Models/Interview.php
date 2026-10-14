<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'scheduled_at',
        'interview_type',
        'meeting_link',
        'location',
        'interviewer_id',
        'status',
        'technical_score',
        'communication_score',
        'commitment_score',
        'overall_score',
        'recommendation',
        'feedback',
        'questions',
        'conducted_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'conducted_at' => 'datetime',
        'technical_score' => 'integer',
        'communication_score' => 'integer',
        'commitment_score' => 'integer',
        'overall_score' => 'float',
        'questions' => 'array',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function interviewer()
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }
}
