import axios from "axios";

export default async function handler(req, res) {
  const { industry, location } = req.query;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${industry}+${location}&key=${process.env.GOOGLE_API_KEY}`;
    const { data } = await axios.get(url);

    const leads = [];

    for (const p of data.results.slice(0, 8)) {
      let website = "";
      let phone = "";

      try {
        const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=website,formatted_phone_number&key=${process.env.GOOGLE_API_KEY}`;
        const d = await axios.get(detUrl);
        website = d.data.result.website || "";
        phone = d.data.result.formatted_phone_number || "";
      } catch {}

      // try to find an email from website homepage (simple regex scrape)
      let email = "";
      if (website) {
        try {
          const page = await axios.get(website);
          const match = page.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (match) email = match[0];
        } catch {}
      }

      leads.push({
        name: p.name,
        address: p.formatted_address,
        website,
        phone,
        email
      });
    }

    res.status(200).json({ leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
