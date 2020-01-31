const express = require("express");
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("database.json");
const app = express();
const database = lowdb(adapter);
const uuidv4 = require("uuid/v4");
const port = process.env.PORT || 8003;

const startDatabase = () => {
  const hasProducts = database.has("products").value();
  const hasCart = database.has("cart").value();

  if (!hasProducts) {
    database.defaults({
      products: [],
      cart: []
    }).write();
  }

  if (!hasCart) {
    database.defaults({
      products: [],
      cart: []
    }).write();
  }
};

app.listen(port, () => {
  console.log("Servern startad vid port: ", port);
  startDatabase();
});

// Lägg till ny produkt
const newProduct = async (name, price, imgurl) => {
  let id = uuidv4();
  const response = await database
    .get("products")
    .push({
      id,
      name,
      price,
      imgurl
    })
    .write();
  return response;
};

app.post("/api/products", async (req, res) => {
  let message = {
    success: true,
    message: "Ny produkt tillagd"
  };

  const {
    name,
    price,
    imgurl
  } = req.query;
  const data = await newProduct(name, price, imgurl);
  message.data = data[data.length - 1];
  return res.send(message);
});

// Hämta alla produkter
app.get("/api/products", (req, res) => {
  res.json(database.get("products").value());
  return res;
});

// Lägg till i varukorgen
const add = async id => {
  let response = "";
  let data = await database
    .get("cart")
    .find({
      id
    })
    .value();
  console.log(data);

  if (!data) {
    data = await database
      .get("products")
      .find({
        id
      })
      .value();

    if (data) {
      data = await database
        .get("cart")
        .push(data)
        .write();
      return data;
    } else {
      return response;
    }
  } else {
    response = false;
  }
  console.log(response);
  return response;
};

app.post("/api/cart", async (req, res) => {
  const {
    id
  } = req.query;
  const data = await add(id);

  if (typeof data == "string" || data instanceof String) {
    message = {
      success: false,
      message: "Ingen produkt funnen"
    };
  } else if (data === false) {
    message = {
      success: false,
      message: "Produkten finns redan i varukorgen"
    };
  } else {
    message = {
      success: true,
      message: "Produkt tillagd i varukorgen"
    };
  }

  message.data = data[data.length - 1];
  return res.send(message);
});

// Ta bort från varukorg
const remove = async id => {
  let response = "";
  const data = await database
    .get("cart")
    .remove({
      id
    })
    .write();

  if (data.length > 0) {
    return data;
  } else {
    return response;
  }
};

app.delete("/api/cart", async (req, res) => {
  const {
    id
  } = req.query;
  const data = await remove(id);

  if (typeof data == "string" || data instanceof String) {
    message = {
      success: false,
      message: "Produkten finns inte i varukorgen"
    };
  } else {
    message = {
      success: true,
      message: "Produkt borttagen"
    };
  }

  message.data = data[data.length - 1];
  return res.send(message);
});

// Hämta varukorg
app.get("/api/cart", (req, res) => {
  res.json(database.get("cart").value());
  return res;
});
