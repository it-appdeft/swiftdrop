<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function approve(Document $document)
    {
        $document->update([
            'verification_status' => 'approved',
            'verified_by'         => auth()->id(),
            'verified_at'         => now(),
            'rejection_reason'    => null,
        ]);

        return back()->with('success', 'Document approved.');
    }

    public function reject(Request $request, Document $document)
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $document->update([
            'verification_status' => 'rejected',
            'verified_by'         => auth()->id(),
            'verified_at'         => now(),
            'rejection_reason'    => $request->reason,
        ]);

        return back()->with('success', 'Document rejected.');
    }
}
