/* ==========================================================================
   Athienitis — site configuration (edit this file, no build step needed)
   ========================================================================== */
window.ATH_CONFIG = {
  /* Seasonal theme. Set to "default", "easter", "summer" or "christmas" — or
     "auto" to pick by date (Easter: the 5 weeks before Orthodox Easter,
     Summer: Jun–Aug, Christmas: 1 Dec–6 Jan). */
  theme: "easter",

  /* Optional: hosted model endpoint for the assistant (see js/assistant.js). */
  aiEndpoint: "",

  themes: {
    easter: {
      accent: "#e4572e", accent2: "#c8102e", tint: "#fde9e3", lime: "#f6c453",
      campaign: {
        photo: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=1200&h=700&q=75&slot=campaign_easter",
        en: { eyebrow: "Easter at Athienitis", title: "Flaounes, tsoureki and souvla for Holy Week.", lead: "Orders for flaounes and tsoureki close on Palm Sunday. Souvla and lamb by phone until Holy Thursday.", cta: "Order for Easter" },
        el: { eyebrow: "Πάσχα στον Αθηαινίτη", title: "Φλαούνες, τσουρέκι και σούβλα για τη Μεγάλη Εβδομάδα.", lead: "Οι παραγγελίες για φλαούνες και τσουρέκια κλείνουν την Κυριακή των Βαΐων. Σούβλα και αρνί τηλεφωνικά μέχρι τη Μεγάλη Πέμπτη.", cta: "Παραγγελία για το Πάσχα" },
        href: "blog/flaounes-easter-bakery.html"
      },
      ticker: { en: ["Flaounes baked fresh from Holy Monday", "Lamb & kid: order by Holy Thursday", "Tsoureki in three flavours this year", "Easter Sunday: open 09:00–14:00"],
                el: ["Φλαούνες φρέσκες από τη Μεγάλη Δευτέρα", "Αρνί & κατσίκι: παραγγελίες μέχρι Μ. Πέμπτη", "Τσουρέκι σε τρεις γεύσεις φέτος", "Κυριακή του Πάσχα: ανοιχτά 09:00–14:00"] }
    },
    summer: {
      accent: "#f26f21", accent2: "#d85a0f", tint: "#fdeadd", lime: "#c1d540",
      campaign: {
        photo: "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=1200&h=700&q=75&slot=campaign_summer",
        en: { eyebrow: "Summer at the market", title: "Watermelon, halloumi and the barbecue counter.", lead: "Souvla cut to order, charcoal and skewers by the bag, and chilled Xynisteri from the cellar.", cta: "See the barbecue bundle" },
        el: { eyebrow: "Καλοκαίρι στην αγορά", title: "Καρπούζι, χαλλούμι και ο πάγκος του μπάρμπεκιου.", lead: "Σούβλα κομμένη κατά παραγγελία, κάρβουνα και σούβλες, παγωμένο Ξυνιστέρι από την κάβα.", cta: "Δείτε το πακέτο μπάρμπεκιου" },
        href: "recipes.html"
      },
      ticker: { en: ["Watermelon €0.70/kg all week", "Souvla pre-orders ready next morning", "Chilled wines in the cellar fridge", "Eatery terrace open till 19:00"],
                el: ["Καρπούζι €0,70/κιλό όλη την εβδομάδα", "Προπαραγγελίες σούβλας έτοιμες το πρωί", "Παγωμένα κρασιά στο ψυγείο της κάβας", "Η βεράντα του εστιατορίου ανοιχτή ως 19:00"] }
    },
    christmas: {
      accent: "#b3262c", accent2: "#8e1b20", tint: "#fbe7e7", lime: "#d4af37",
      campaign: {
        photo: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1200&h=700&q=75&slot=campaign_christmas",
        en: { eyebrow: "Christmas at Athienitis", title: "Gift boxes, kourabiedes and the festive table.", lead: "Cyprus-flavours gift boxes from the Gifts counter, turkey and pork by the kilo from the butchery, Commandaria from the cellar.", cta: "Shop the gift boxes" },
        el: { eyebrow: "Χριστούγεννα στον Αθηαινίτη", title: "Κουτιά δώρου, κουραμπιέδες και το γιορτινό τραπέζι.", lead: "Κουτιά δώρου με γεύσεις Κύπρου, γαλοπούλα και χοιρινό με το κιλό από το κρεοπωλείο, Κουμανδαρία από την κάβα.", cta: "Δείτε τα κουτιά δώρου" },
        href: "shops/gifts.html"
      },
      ticker: { en: ["Gift boxes wrapped free at the till", "Kourabiedes & melomakarona from 1 Dec", "Order your turkey by 20 December", "24 & 31 Dec: open 07:30–16:00"],
                el: ["Δωρεάν περιτύλιγμα δώρων στο ταμείο", "Κουραμπιέδες & μελομακάρονα από 1 Δεκ", "Παραγγείλτε γαλοπούλα μέχρι 20 Δεκεμβρίου", "24 & 31 Δεκ: ανοιχτά 07:30–16:00"] }
    }
  }
};
