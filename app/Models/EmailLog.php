<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'sender_email',
        'recipient_email',
        'subject',
        'body',
        'type',
        'status',
        'template_name',
        'sent_by',
        'is_read',
        'is_starred',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_starred' => 'boolean',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function sentByUser()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
