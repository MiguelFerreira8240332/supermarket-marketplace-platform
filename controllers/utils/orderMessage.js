exports.buildOrderSummary = (order) => {

    const products = order.products
        .map(item =>
            `• ${item.productId.name} x${item.amount} - ${(item.price * item.amount).toFixed(2)}€`
        )
        .join('\n');

    return `
        Supermercado:
        ${order.supermarket.name}

        Produtos:
        ${products}

        Método de entrega:
        ${order.deliveryMethod}

        Custo entrega:
        ${order.deliveryCost.toFixed(2)}€

        Total:
        ${order.totalValue.toFixed(2)}€
    `;
};