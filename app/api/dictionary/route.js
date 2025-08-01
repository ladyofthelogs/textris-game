import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (response.ok) {
      // Check if the response contains actual definitions.
      // Some APIs might return an empty array or a specific error structure for non-words even with a 200 status.
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].word) {
        return NextResponse.json({ isValid: true });
      } else {
        return NextResponse.json({ isValid: false });
      }
    } else if (response.status === 404) {
      return NextResponse.json({ isValid: false });
    } else {
      // Handle other API errors
      console.error(`Dictionary API error for word "${word}": ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Dictionary API error' }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error fetching from dictionary API for word "${word}":`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}