// Estrutura inicial limpa para um novo estabelecimento.
// Todos os campos começam vazios — o lojista preenche tudo com seus dados reais.
export function seedStore({ name, phone, slug }) {
  return {
    slug,
    name: name || '',
    tagline: '',
    phone: phone || '',
    addr: '',
    hours: '',
    closeTime: '',
    fee: 5,
    minOrder: 30,
    deliveryTime: '',
    rating: '',
    promoTxt: '',
    promoTag: '',
    logo: '',
    color: '#c0392b',
    template: 'classic',
    features: { urgency: false, social: false, promo: false, combos: true, reviews: true, minbar: true, orbit: false, upsell: false },
    categories: [],
    products: [],
    combos: [],
    reviews: [],
  };
}

