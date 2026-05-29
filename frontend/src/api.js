const properties = [
  {
    id: 1,
    title: "Harbour View Loft",
    city: "Copenhagen, Denmark",
    price: "DKK 9,200,000",
    bedrooms: 3,
    bathrooms: 2,
    tag: "Luxury"
  },
  {
    id: 2,
    title: "Nordic Family Home",
    city: "Aarhus, Denmark",
    price: "DKK 6,800,000",
    bedrooms: 4,
    bathrooms: 3,
    tag: "Family"
  },
  {
    id: 3,
    title: "City Center Penthouse",
    city: "Odense, Denmark",
    price: "DKK 12,500,000",
    bedrooms: 3,
    bathrooms: 2,
    tag: "Penthouse"
  }
]

export async function fetchProperties(searchTerm = '') {
  const query = searchTerm.toLowerCase()

  return properties.filter((property) => {
    return (
      property.title.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.tag.toLowerCase().includes(query)
    )
  })
}

export async function submitContact(payload) {
  console.log(payload)

  return {
    message: 'Message sent successfully'
  }
}
