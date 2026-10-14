<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RelatedPartySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parties = [
            'محمد محمود',
            'علي اسماعيل أبو طه',
            'سمية طلعت',
            'حساب بنك القاهرة',
            'صندوق سلمان ابراهيم المر',
        ];

        foreach ($parties as $party) {
            \App\Models\RelatedParty::create(['name' => $party]);
        }
    }
}
