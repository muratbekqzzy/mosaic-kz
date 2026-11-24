import { site } from "@/config/site";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function localBusinessLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeGoodsStore"],
    "@id": `${site.url}/#business`,
    name: site.name,
    description: "Natural stone mosaic, laid by hand in Almaty. Delivery across Kazakhstan.",
    url: site.url,
    telephone: `+${site.whatsapp}`,
    priceRange: "₸₸",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.address.lat, longitude: site.address.lng },
    openingHours: site.hours,
    areaServed: { "@type": "Country", name: "Kazakhstan" },
    sameAs: [site.instagram, site.twoGis],
  };
}
