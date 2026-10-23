<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone',
        'avatar',
        'status',
        'locale',
        'working_hours',
        'otp_code',
        'otp_expires_at',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp_code',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'working_hours' => 'array',
            'otp_expires_at' => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }

    public function getWorkingHoursOrDefault(): array
    {
        if (!empty($this->working_hours) && is_array($this->working_hours)) {
            return $this->working_hours;
        }

        // Default standard working hours: Sunday to Thursday from 09:00 to 17:00
        return [
            [
                'days' => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                'all_day' => false,
                'from' => '09:00',
                'to' => '17:00',
            ]
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function applicant()
    {
        return $this->hasOne(Applicant::class);
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class, 'interviewer_id');
    }

    public function appNotifications()
    {
        return $this->hasMany(AppNotification::class, 'user_id');
    }

    public function hasRole(string $roleName): bool
    {
        return $this->role && $this->role->name === $roleName;
    }

    public function hasPermission(string $permissionName): bool
    {
        if (!$this->role) {
            return false;
        }

        // Super Admin has all permissions
        if ($this->role->name === 'super_admin') {
            return true;
        }

        return $this->role->permissions()->where('name', $permissionName)->exists();
    }
}
