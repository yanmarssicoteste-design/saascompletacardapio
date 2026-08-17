// Dados iniciais para um novo estabelecimento food. O campo `template` define
// qual layout de cardápio será exibido ('classic' | 'editorial' | 'dark').
export function seedStore({ name, phone, slug }) {
  return {
    slug,
    name: name || 'Meu Estabelecimento',
    tagline: 'Feito com amor, entregue com sabor',
    phone: phone || '',
    addr: '',
    hours: '18h–23h',
    closeTime: '23:00',
    fee: 5,
    minOrder: 30,
    deliveryTime: '40–60 min',
    rating: '5.0 (novo)',
    promoTxt: '🔥 Edite esta mensagem promocional no painel',
    promoTag: 'NOVIDADE',
    logo: '',
    color: '#c0392b',
    template: 'classic',
    features: { urgency: true, social: true, promo: true, combos: true, reviews: true, minbar: true, orbit: true, upsell: true },
    categories: [
      { id: 'c1', name: 'Lanches', emoji: '🍔', type: 'single', display: 'featured' },
      { id: 'c2', name: 'Pizzas', emoji: '🍕', type: 'sizes', display: 'featured' },
      { id: 'c3', name: 'Bebidas', emoji: '🥤', type: 'single', display: 'list' },
      { id: 'c4', name: 'Sobremesas', emoji: '🍧', type: 'single', display: 'list' },
    ],
    products: [
      { id: 'p1', name: 'X-Burguer Gourmet', cat: 'c1', desc: 'Blend artesanal 180g, queijo cheddar derretido, alface americana, tomate e maionese especial da casa.', img: '', prices: [32], active: true },
      { id: 'p2', name: 'X-Bacon Duplo', cat: 'c1', desc: 'Dois blends 150g, bacon crocante, queijo prato, cebola caramelizada e molho barbecue artesanal.', img: '', prices: [39], active: true },
      { id: 'p3', name: 'Pizza Margherita', cat: 'c2', desc: 'Molho de tomate artesanal, mussarela de búfala fresca e manjericão fresco.', img: '', prices: [38, 48, 62], active: true },
      { id: 'p4', name: 'Coca-Cola 2L', cat: 'c3', desc: 'Gelada e refrescante.', img: '', prices: [12], active: true },
      { id: 'p5', name: 'Açaí 500ml', cat: 'c4', desc: 'Açaí cremoso com granola, banana e leite condensado. Adicione coberturas a gosto.', img: '', prices: [22], active: true },
    ],
    combos: [
      { id: 'co1', name: 'Combo do Dia', price: 45, origPrice: 56, items: '1 X-Burguer Gourmet + Batata Frita M + 1 Refrigerante 500ml', saving: 'Economize R$11', img: '', active: true },
    ],
    reviews: [],
  };
}
