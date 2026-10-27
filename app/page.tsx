"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Kind = "stay" | "trek" | "camping" | "package";
type Listing = { id?: string; title: string; slug: string; kind: Kind; location: string; description: string; price_inr: number; duration: string; image_url: string; highlights: string[]; published?: boolean };
type ChatMessage = { role: "user" | "assistant"; text: string };

const demoListings: Listing[] = [
  {title:"Forest Edge Stay",slug:"forest-edge-stay",kind:"stay",location:"Wayanad, Kerala",description:"Sample nature stay. Confirm actual amenities, rates and availability with GoGram.",price_inr:3500,duration:"Per night",image_url:"https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85",highlights:["Nature views","Relaxing escape"]},
  {title:"Misty Mountain Trek",slug:"misty-mountain-trek",kind:"trek",location:"Wayanad, Kerala",description:"Sample guided nature walk. Route, permits, weather and guide availability must be confirmed.",price_inr:1200,duration:"Half day",image_url:"https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85",highlights:["Guided experience","Weather dependent"]},
  {title:"Green Valley Camping",slug:"green-valley-camping",kind:"camping",location:"Wayanad, Kerala",description:"Sample outdoor camping concept. Facilities, safety arrangements and dates require confirmation.",price_inr:2200,duration:"1 night",image_url:"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85",highlights:["Outdoor stay","Date confirmation required"]},
  {title:"Wayanad Weekend Escape",slug:"wayanad-weekend-escape",kind:"package",location:"Wayanad, Kerala",description:"Sample short itinerary. Final inclusions, itinerary and availability must be confirmed.",price_inr:5999,duration:"2 days / 1 night",image_url:"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85",highlights:["Sample itinerary","Customizable enquiry"]}
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}
const  whatsappPhone = () =>
  String(process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "919778174859")
    .replace(/\D/g, "");

function AmanFace() {
  return (
    <span className="aman-face" aria-hidden="true">
      <span className="aman-face-hair" />
      <span className="aman-face-eye aman-face-eye-left" />
      <span className="aman-face-eye aman-face-eye-right" />
      <span className="aman-face-cheek aman-face-cheek-left" />
      <span className="aman-face-cheek aman-face-cheek-right" />
      <span className="aman-face-mouth" />
    </span>
  );
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>(demoListings);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [bookingListing, setBookingListing] = useState<Listing | null>(null);
  const [bookingStatus, setBookingStatus] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{role:"assistant",text:"Hi, I'm Aman! Ask me about stays, trekking, camping or planning a Wayanad trip."}]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminPrice, setAdminPrice] = useState("2500");
  const [adminKind, setAdminKind] = useState<Kind>("stay");
  const [adminMessage, setAdminMessage] = useState("");

  const visibleListings = useMemo(() => filter === "all" ? listings : listings.filter(x => x.kind === filter), [filter, listings]);
  const phone = whatsappPhone();

  async function refreshListings() {
    const supabase = getSupabase();
    if (!supabase) { setAdminMessage("Demo mode: configure Supabase to load saved listings."); return; }
    const { data, error } = await supabase.from("listings").select("*").eq("published", true).order("created_at", {ascending:false});
    if (error) { setAdminMessage("Could not load listings. Check Supabase configuration and row-level security."); return; }
    if (data) setListings(data as Listing[]);
    setAdminMessage("Published listings refreshed.");
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookingListing) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      title: bookingListing.title,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      date: String(form.get("date") || ""),
      guests: Number(form.get("guests") || 1)
    };
    try {
      const response = await fetch("/api/booking", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result = await response.json();
      setBookingStatus(result.message || "Request processed.");
    } catch {
      setBookingStatus("Could not send request. Please try WhatsApp instead.");
    }
  }

  function whatsappUrl(listing: Listing) {
    const message = `Hi GoGram! I'm interested in ${listing.title} (${listing.duration}, sample price ₹${listing.price_inr}). Please confirm the actual price, availability and inclusions.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  async function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || chatBusy) return;
    setChatMessages(prev => [...prev, {role:"user",text:question}]);
    setChatInput("");
    setChatBusy(true);
    try {
      const response = await fetch("/api/chat", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:question})});
      const result = await response.json();
      setChatMessages(prev => [...prev, {role:"assistant",text:result.reply || "Sorry, I couldn't answer right now."}]);
    } catch {
      setChatMessages(prev => [...prev, {role:"assistant",text:"I'm having trouble connecting. Please contact GoGram on WhatsApp."}]);
    } finally { setChatBusy(false); }
  }

  async function addListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = adminTitle.trim(), price = Number(adminPrice);
    if (!title || !Number.isFinite(price) || price < 0) { setAdminMessage("Enter a title and valid non-negative price."); return; }
    const item: Listing = {
      title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Date.now().toString().slice(-4),
      kind: adminKind, location:"Wayanad, Kerala", description:"Replace with verified details, inclusions and policies.",
      price_inr:price, duration:adminKind==="stay"?"Per night":adminKind==="package"?"Package":"Per person",
      image_url:demoListings.find(x=>x.kind===adminKind)?.image_url || demoListings[0].image_url, highlights:["Details to be confirmed"]
    };
    const supabase = getSupabase();
    if (supabase) {
      const {error} = await supabase.from("listings").insert({...item,published:false});
      if (error) { setAdminMessage("Could not save draft. This demo panel has no admin authentication yet."); return; }
      setAdminMessage("Draft sent to Supabase. Add a protected admin workflow before publishing.");
    } else {
      setListings(prev => [item, ...prev]);
      setAdminMessage("Added to this demo session only. Configure Supabase for persistence.");
    }
    setAdminTitle("");
  }

  return (
   <main>
   <header className="topnav">
  <a className="logo" href="#">
    <img
      src="/image/gogram-logo.png"
      alt="GoGram Travels"
      className="logo-mark"
    />
    <span>
      gogram
      <small>WAYANAD, YOUR WAY</small>
    </span>
  </a>

  <nav>
    <a href="#experiences">Experiences</a>
    <a href="#itineraries">Packages</a>
    <a href="#last-trip">Last trip</a>
    <a href="#about">Our story</a>
  </nav>

  <div className="nav-right">
    <a
      className="nav-whatsapp"
      href="https://wa.me/919778174859?text=Hi%20GoGram"
      target="_blank"
      rel="noreferrer"
    >
      WhatsApp us
    </a>
  </div>
</header>

    <section className="hero"><div className="hero-image"/><div className="hero-overlay"/>
      <div className="hero-content"><div className="eyebrow"><span/> SLOW TRAVEL · WILD EXPERIENCES</div><h1>Find your<br/><em>kind of wild.</em></h1><p>Hidden stays, mountain trails and nights under the stars. Your Wayanad story starts here.</p><div className="hero-actions"><a className="btn btn-light" href="#experiences">Explore experiences <span>↘</span></a><a className="btn btn-ghost" href={`https://wa.me/${phone}?text=${encodeURIComponent("Hi GoGram! Help me plan a Wayanad trip.")}`} target="_blank" rel="noreferrer">Plan my trip ↗</a></div><div className="hero-foot"><span>WAYANAD, KERALA, INDIA</span><span>TRAVEL GENTLY</span></div></div>
      <div className="hero-stamp"><span>GO SLOW.</span><strong>STAY<br/>WILD.</strong><span>LEAVE IT BETTER.</span></div>
    </section>

    <section className="intro section" id="about"><div className="section-kicker">A LITTLE CLOSER TO NATURE</div><div className="intro-grid"><h2>Not just a trip.<br/><em>A feeling.</em></h2><div><p>Trade crowded plans for quiet mornings, misty trails and places that stay with you. GoGram helps you discover stays and outdoor experiences across Wayanad.</p><a href="#experiences" className="under-link">Find your escape <span>↗</span></a></div></div></section>

    <section className="trip-gallery section" id="last-trip">
      <div className="trip-gallery-heading">
        <div className="section-kicker">FIELD NOTES · OUR LAST TRIP</div>
        <h2>Good company.<br/><em>Out in the world.</em></h2>
      </div>
      <div className="trip-gallery-grid">
        <figure>
          <div className="trip-photo-frame" style={{ position: "relative" }}>
            <Image src="/image/1.png" alt="The group gathered beside their travel bus" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" className="trip-photo bus-photo" />
          </div>
          <figcaption><span>01</span> Ready for the road</figcaption>
        </figure>
        <figure>
          <div className="trip-photo-frame" style={{ position: "relative" }}>
            <Image src="/image/IMG_2926.jpg" alt="Friends gathered beneath colorful flags outdoors" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" className="trip-photo flags-photo" />
          </div>
          <figcaption><span>02</span> A day together</figcaption>
        </figure>
        <figure>
          <div className="trip-photo-frame" style={{ position: "relative" }}>
            <Image src="/image/IMG_2927.jpg" alt="Friends posing together among the trees" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" className="trip-photo trees-photo" />
          </div>
          <figcaption><span>03</span> Under the trees</figcaption>
        </figure>
      </div>
    </section>

    <section className="experiences section" id="experiences"><div className="section-top"><div><div className="section-kicker">MAKE IT YOURS</div><h2>Choose your <em>escape.</em></h2></div><button className="under-link button-link" onClick={() => setFilter("all")}>All experiences ↗</button></div>
      <div className="filters">{[{id:"all",label:"Everything"},{id:"stay",label:"Stays & resorts"},{id:"trek",label:"Trekking"},{id:"camping",label:"Camping"},{id:"package",label:"Packages"}].map(f=><button key={f.id} className={filter===f.id?"selected":""} onClick={() => setFilter(f.id as "all"|Kind)}>{f.label}</button>)}</div>
      <div className="listing-grid">{visibleListings.map(item=><article className="listing-card" key={item.slug}><div className="listing-image" style={{backgroundImage:`url("${item.image_url}")`}}><span className="listing-type">{({stay:"STAY",trek:"TREK",camping:"CAMP",package:"GETAWAY"} as Record<string,string>)[item.kind]}</span><button className="save-mark" aria-label={`Enquire about ${item.title}`} onClick={() => {setBookingListing(item);setBookingStatus("");}}>↗</button></div><div className="listing-info"><div className="listing-location">⌖ &nbsp;{item.location}</div><h3>{item.title}</h3><p>{item.description}</p><div className="listing-bottom"><div><span>SAMPLE FROM</span><strong>₹{item.price_inr.toLocaleString("en-IN")}</strong><small>{item.duration}</small></div><button className="book-link" onClick={() => {setBookingListing(item);setBookingStatus("");}}>Enquire / book ↗</button></div></div></article>)}</div>
      <p className="demo-note">All names, images and prices are sample placeholders. Replace them with verified GoGram offerings before launch.</p>
    </section>

    <section className="itinerary section" id="itineraries"><div className="itinerary-image" role="img" aria-label="Misty mountain landscape"/><div className="itinerary-copy"><div className="section-kicker">YOUR WEEKEND, REIMAGINED</div><h2>Two days.<br/><em>More to remember.</em></h2><p>A sample Wayanad escape with slow mornings, a guided outdoor experience and time to take it all in. Final plans depend on season, weather, permissions and availability.</p><div className="itinerary-steps"><div><span>DAY 01</span><p>Arrive, settle into your stay and explore nearby nature spots.</p></div><div><span>DAY 02</span><p>Choose a permitted guided walk or outdoor activity before heading home.</p></div></div><button className="btn btn-dark" onClick={() => {setBookingListing(demoListings[3]);setBookingStatus("");}}>Build my getaway ↗</button></div></section>

    <section className="trust section"><div><span>01</span><h3>Thoughtfully planned</h3><p>Stays and experiences selected for your kind of escape.</p></div><div><span>02</span><h3>Local at heart</h3><p>Discover Wayanad with respect for the people and place.</p></div><div><span>03</span><h3>Plan with a human</h3><p>Get help through WhatsApp before you book.</p></div></section>

    <footer className="footer">
      <div className="footer-top">
        <a className="logo footer-logo" href="#" aria-label="GoGram Travels home">
          <img src="/image/gogram-logo.png" alt="" className="logo-mark" />
          <span>gogram<small>WAYANAD, YOUR WAY</small></span>
        </a>
        <div className="footer-copy">
          <div className="section-kicker">YOUR NEXT STORY IS OUT THERE</div>
          <h2>Wayanad is waiting.<br/><em>Let&apos;s go.</em></h2>
          <p>Find a stay, follow a trail, or plan a slower weekend with the GoGram team.</p>
        </div>
        <a className="btn btn-light" href={`https://wa.me/919778174859?text=${encodeURIComponent("Hi GoGram! Let's plan a Wayanad getaway.")}`} target="_blank" rel="noreferrer">Plan with GoGram ↗</a>
      </div>
      <div className="footer-bottom">
        <span>© 2026 GoGram Travels · Wayanad, Kerala</span>
        <a href="#">Back to top ↑</a>
        <span>Travel gently. Leave no trace.</span>
      </div>
    </footer>

    {bookingListing && <div className="modal-backdrop" onClick={() => setBookingListing(null)}><section className="booking-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={() => setBookingListing(null)} aria-label="Close">×</button><div className="section-kicker">YOUR NEXT ADVENTURE</div><h2>Enquire about <em>{bookingListing.title}</em></h2><p className="muted">Sample from ₹{bookingListing.price_inr.toLocaleString("en-IN")} · {bookingListing.duration}. This form does not confirm a reservation or charge you.</p><form onSubmit={submitBooking} className="booking-form"><label>Full name<input name="name" required placeholder="Your name"/></label><label>Email<input name="email" type="email" placeholder="you@example.com"/></label><label>Phone / WhatsApp<input name="phone" required type="tel" placeholder="+91…"/></label><label>Preferred date<input name="date" required type="date" min={new Date().toISOString().slice(0,10)}/></label><label>Guests<select name="guests" defaultValue="2">{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} {n===1?"guest":"guests"}</option>)}</select></label><button className="btn btn-dark" type="submit">Send booking request ↗</button>{bookingStatus&&<p className="form-result">{bookingStatus}</p>}<a className="modal-whatsapp" href={whatsappUrl(bookingListing)} target="_blank" rel="noreferrer">Or continue on WhatsApp ↗</a></form></section></div>}

           {adminOpen && (
        <div className="admin-backdrop">
          <section className="admin-panel">
            {/* Keep your existing admin panel content here */}
          </section>
        </div>
      )}

      <button
        className="chat-launcher"
        type="button"
        aria-label={chatOpen ? "Close Aman AI assistant" : "Open Aman AI assistant"}
        aria-expanded={chatOpen}
        aria-controls="gogram-chat"
        onClick={() => setChatOpen(open => !open)}
      >
        {chatOpen ? "×" : <AmanFace />}
      </button>

      {chatOpen && (
        <section className="chat-window" id="gogram-chat" role="dialog" aria-label="Aman AI assistant">
          <div className="chat-header">
            <div className="chat-avatar"><AmanFace /></div>
            <div><strong>Aman</strong><small>GoGram trip assistant</small></div>
            <button type="button" aria-label="Close chat" onClick={() => setChatOpen(false)}>×</button>
          </div>
          <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
            {chatMessages.map((message, index) => (
              <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
            {chatBusy && <div className="chat-bubble assistant">Planning a helpful answer…</div>}
          </div>
          <form className="chat-input-row" onSubmit={sendChat}>
            <input
              value={chatInput}
              onChange={event => setChatInput(event.target.value)}
              placeholder="Ask about your trip…"
              aria-label="Message Aman"
              disabled={chatBusy}
            />
            <button type="submit" aria-label="Send message" disabled={chatBusy || !chatInput.trim()}>↗</button>
          </form>
          <p className="chat-footnote">AI suggestions are a starting point. Confirm details with GoGram.</p>
        </section>
      )}
    </main>
  );
}