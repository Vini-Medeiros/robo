const { Firestore } = require('@google-cloud/firestore');
const { Builder, By, until } = require('selenium-webdriver');

require('chromedriver');

// Configurando o Firestore
const firestore = new Firestore({
  projectId: 'robo-afa90',
  keyFilename: './bot/chave.json'
});

// Obter todos os produtos do Firestore
async function getAllProductsFromFirestore() {
    const productsRef = firestore.collection('produtos');
    const snapshot = await productsRef.get();
    const products = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco
      });
    });
  
    return products;
  }
  
 

// Usar o Selenium para digitar o nome do produto nas Lojas Americanas
// ...

// Usar o Selenium para digitar o nome do produto nas Lojas Americanas
async function searchProductOnAmericanas(produtos) {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('https://store.steampowered.com/');
    const inputPesquisa = await driver.wait(until.elementLocated(By.xpath('//*[@id="store_nav_search_term"]')), 10000);
    await inputPesquisa.sendKeys(produtos.nome);
    await inputPesquisa.submit();
    await driver.wait(until.elementLocated(By.xpath('//*[@id="search_resultsRows"]/a[1]/div[2]/div[1]/span')), 10000).click()
    // Aguarde alguns segundos para ver o resultado, ajuste conforme necessário
    await driver.sleep(2000);
    let priceElement = await driver.wait(until.elementLocated(By.xpath('//*[@id="game_area_purchase_section_add_to_cart_653391"]/div[2]/div/div[1]')), 10000);
    priceElement = await priceElement.getText();

    // Extract only the numeric part
    const priceNumeric = parseFloat(priceElement.replace(/[^\d.,]/g, '').replace(',', '.'));

    console.log(`Preço do jogo "${produtos.nome}" na Steam: ${priceNumeric}`);

    let precoProduto = parseFloat(produtos.preco); // Assuming 'preco' is already a number

    console.log(precoProduto);

    if (precoProduto < priceNumeric) {
      console.log(`Preço no banco de dados (${precoProduto}) é menor. Adicionando ao carrinho...`);
      await driver.wait(until.elementLocated(By.xpath('//*[@id="btn_add_to_cart_653391"]/span')), 10000).click();
      // Add the product to the cart logic here
    } else {
      console.log(`Preço no banco de dados (${precoProduto}) é igual ou maior. Descartando...`);
      // Discard the product logic here
    }

  } finally {
    // Close the browser window after processing
    await driver.quit();
  }
}

// ...


(async () => {
  const products = await getAllProductsFromFirestore();
  if (products && products.length > 0) {
    for (const product of products) {
      await searchProductOnAmericanas(product);
    }
  } else {
    console.log('Não foram encontrados produtos no Firestore.');
  }
})();
