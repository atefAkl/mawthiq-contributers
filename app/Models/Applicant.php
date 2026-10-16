<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Applicant extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_no',
        'full_name',
        'email',
        'phone',
        'national_id',
        'age',
        'birth_date',
        'gender',
        'country',
        'city',
        'governorate',
        'address',
        'marital_status',
        'position',
        'experience_years',
        'education_level',
        'portfolio_url',
        'linkedin_url',
        'github_url',
        'resume_path',
        'attachments',
        'cover_letter',
        'skills',
        'social_links',
        'portfolio_items',
        'status',
        'rating',
        'rejection_reason',
        'internal_notes',
        'created_by',
    ];

    protected $casts = [
        'attachments' => 'array',
        'skills' => 'array',
        'social_links' => 'array',
        'portfolio_items' => 'array',
        'experience_years' => 'integer',
        'age' => 'integer',
        'rating' => 'float',
    ];

    protected $appends = [
        'status_label_ar',
        'status_label_en',
    ];

    public const STATUS_APPLICANT = 'applicant';
    public const STATUS_PARTICIPANT = 'participant';
    public const STATUS_PROBATION = 'probation';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_APPLICANT => ['ar' => 'متقدم', 'en' => 'Applicant', 'color' => 'blue'],
            self::STATUS_PARTICIPANT => ['ar' => 'مشارك', 'en' => 'Participant', 'color' => 'indigo'],
            self::STATUS_PROBATION => ['ar' => 'تحت الاختبار', 'en' => 'Under Probation', 'color' => 'amber'],
            self::STATUS_ACCEPTED => ['ar' => 'مقبول', 'en' => 'Accepted', 'color' => 'emerald'],
            self::STATUS_REJECTED => ['ar' => 'مرفوض', 'en' => 'Rejected', 'color' => 'rose'],
        ];
    }

    public function getStatusLabelArAttribute(): ?string
    {
        if (empty($this->status)) {
            return null;
        }
        return self::getStatuses()[$this->status]['ar'] ?? (string)$this->status;
    }

    public function getStatusLabelEnAttribute(): ?string
    {
        if (empty($this->status)) {
            return null;
        }
        return self::getStatuses()[$this->status]['en'] ?? (string)$this->status;
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class)->orderBy('scheduled_at', 'desc');
    }

    public function statusLogs()
    {
        return $this->hasMany(ApplicantStatusLog::class)->orderBy('created_at', 'desc');
    }

    public function emailLogs()
    {
        return $this->hasMany(EmailLog::class)->orderBy('created_at', 'desc');
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
