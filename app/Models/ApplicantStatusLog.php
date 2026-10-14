<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantStatusLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'from_status',
        'to_status',
        'changed_by',
        'notes',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
