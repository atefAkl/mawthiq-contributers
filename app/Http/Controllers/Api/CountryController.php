<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\City;
use Illuminate\Http\Request;

class CountryController extends Controller
{
    /**
     * Get all active countries
     */
    public function index(Request $request)
    {
        $countries = Country::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('name_ar', 'asc')
            ->get();

        return response()->json([
            'data' => $countries,
        ]);
    }

    /**
     * Get cities/governorates for a specific country (by ID or ISO code or Arabic/English name)
     */
    public function getCities(Request $request, $countryId)
    {
        $country = null;

        if (is_numeric($countryId)) {
            $country = Country::find($countryId);
        }

        if (!$country) {
            $country = Country::where('code', strtoupper($countryId))
                ->orWhere('name_ar', $countryId)
                ->orWhere('name_en', $countryId)
                ->first();
        }

        if (!$country) {
            return response()->json([
                'data' => [],
                'message' => 'الدولة غير موجودة',
            ], 404);
        }

        $cities = City::where('country_id', $country->id)
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('name_ar', 'asc')
            ->get();

        return response()->json([
            'country' => $country,
            'data' => $cities,
        ]);
    }
}
