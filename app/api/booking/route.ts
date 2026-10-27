import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    const date = typeof body.date === "string" ? body.date : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 150) : "";
    const guests = Number(body.guests);
    if (!name || !phone || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(guests) || guests < 1 || guests > 30) {
      return NextResponse.json({ message: "Please enter your name, phone, preferred date and a valid guest count." }, { status: 400 });
    }
    // Demo: validates but does not persist, charge or confirm a reservation.
    console.log("GoGram booking enquiry (demo):", { name, phone, email, date, title, guests });
    return NextResponse.json({ message: "Your enquiry was validated in demo mode, but is not saved or confirmed yet. Please use WhatsApp to confirm availability with GoGram." });
  } catch {
    return NextResponse.json({ message: "Invalid request. Please try again." }, { status: 400 });
  }
}
