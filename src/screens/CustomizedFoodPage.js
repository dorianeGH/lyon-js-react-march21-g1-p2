import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import axios from 'axios';
import API from '../APIClient';

import pizzabox from '../assets/pizzabox.png';
import PizzaChange from '../components/PizzaChange';
import emptyPizza from '../assets/empty-pizza.png';

require('dotenv').config();

const { CancelToken } = axios;

const convertArrayToObject = (array, key) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item.quantity,
    };
  }, initialValue);
};

export default function CustomizedFoodPage() {
  const [ingredientsKcal, setIngredientsKcal] = useState([]);
  const [error, setError] = useState('');
  const [loadingIngredientsListDB, setLoadingIngredientsListDB] = useState(
    false
  );

  const location = useLocation();
  const [chosenIngredientsList, setChosenIngredientsList] = useState([]);
  const [dataForConfirmation, setDataForConfirmation] = useState({});
  const [orderData, setOrderData] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const handleError = (err) => {
    if (!axios.isCancel(err))
      setError(
        'We were not able to recover the data, sorry for the inconvenience'
      );
  };

  // Retrieving the list of ingredients from the database
  useEffect(() => {
    const source = CancelToken.source();
    setLoadingIngredientsListDB(true);
    API.get('/order/create-pizza', { cancelToken: source.token })
      .then((res) => {
        setIngredientsKcal(res.data);
        setChosenIngredientsList(
          res.data.slice(0, 2).map((ingred) => {
            return { ...ingred, quantity: 1 };
          })
        );
      })
      .catch(handleError)
      .finally(() => {
        if (
          !(
            source.token.reason &&
            source.token.reason.message === 'request cancelled'
          )
        )
          setLoadingIngredientsListDB(false);
      });
    return () => {
      source.cancel('request cancelled');
    };
  }, []);

  // List of preselected ingredients (if any) from page of predefined pizzas
  const selectedIngredients =
    location.state != null ? location.state.selectIngredients : [];

  // using Webpack require.context to dynamically import images from the names of files recorded in the database
  const requestImageFile = require.context('../assets', true, /.*/);

  /* Construction of the basic list of ingredients (= at least pizza dough + tomato sauce if "customization from scratch"
     +/- the ingredients selected by the predefined pizza, if they exist) */
  useEffect(() => {
    if (ingredientsKcal.length > 0) {
      const selectedIngredkcal = selectedIngredients.map((ingred) => {
        const ingredToSelect = ingredientsKcal.find(
          (ingredientKcal) => ingredientKcal.name === ingred[0]
        );

        return {
          id: ingredToSelect.id,
          name: ingredToSelect.name,
          imgsrc: ingredToSelect.imglayer,
          quantity: ingred[1],
          serving: ingredToSelect.serving,
          kcal100: ingredToSelect.kcal100,
          price: ingredToSelect.price,
        };
      });
      setChosenIngredientsList((IngredientsList) => [
        ...IngredientsList,
        ...selectedIngredkcal,
      ]);
    }
  }, [ingredientsKcal]);

  /* function to update the rendering of the quantity of each ingredient */
  const setServingQuantity = (ingredientId) => {
    const ingredExists = chosenIngredientsList.filter(
      (ingred) => ingred.id === ingredientId
    );

    return ingredExists.length > 0 ? (
      <span className="m-0">{ingredExists[0].quantity} </span>
    ) : (
      <span className="m-0">0 </span>
    );
  };

  /* function to manage the adding/removing of ingredients on the customized pizza */
  const handleChangeQuantity = (id, name, operator) => {
    const ingredToUpdate = chosenIngredientsList.filter(
      (ingred) => ingred.id === id
    );
    const currentQuantity =
      ingredToUpdate.length === 0 ? 0 : ingredToUpdate[0].quantity;

    if (operator === 'add') {
      if (ingredToUpdate.length === 0) {
        if (name === 'Ananas') {
          alert(
            "Etes-vous certain qu'ajouter de l'ananas sur votre pizza n'enfreint pas les lois de votre pays ?!!!"
          );
        }
        const ingredToAdd = ingredientsKcal.filter(
          (ingred) => ingred.id === id
        );
        setChosenIngredientsList((IngredientsList) => [
          ...IngredientsList,
          {
            id: ingredToAdd[0].id,
            name: ingredToAdd[0].name,
            imgsrc: ingredToAdd[0].imglayer,
            quantity: 1,
            serving: ingredToAdd[0].serving,
            kcal100: ingredToAdd[0].kcal100,
            price: ingredToAdd[0].price,
          },
        ]);
      } else {
        setChosenIngredientsList(
          chosenIngredientsList.map((currentIngredient) =>
            currentIngredient.id === ingredToUpdate[0].id
              ? {
                  ...currentIngredient,
                  quantity: currentIngredient.quantity + 1,
                }
              : currentIngredient
          )
        );
      }
    } else if (operator === 'remove') {
      if (currentQuantity > 1) {
        setChosenIngredientsList(
          chosenIngredientsList.map((currentIngredient) =>
            currentIngredient.id === ingredToUpdate[0].id
              ? {
                  ...currentIngredient,
                  quantity: currentIngredient.quantity - 1,
                }
              : currentIngredient
          )
        );
      } else if (currentQuantity === 1) {
        const cleanedingredients = chosenIngredientsList.filter(
          (ingred) => ingred.id !== id
        );
        setChosenIngredientsList(cleanedingredients);
      }
    }
  };

  const handleEmptyingPizza = () => {
    setChosenIngredientsList(chosenIngredientsList.slice(0, 2));
  };

  // construction of the array sent to ConfirmationPage : first step
  useEffect(() => {
    setOrderData(
      chosenIngredientsList.map((ingred) => {
        return {
          name: ingred.name,
          quantity: ingred.quantity,
          ingredprice: ingred.quantity * ingred.price,
        };
      })
    );
  }, [chosenIngredientsList]);

  // construction of the array sent to ConfirmationPage : second step
  useEffect(() => {
    setTotalPrice(
      orderData.reduce((total, ingredient) => total + ingredient.ingredprice, 0)
    );
    const ingredsObject = convertArrayToObject(orderData, 'name');
    setDataForConfirmation({
      ingredients: JSON.stringify(ingredsObject),
      quantity: 1,
      price: totalPrice,
    });
  }, [orderData]);

  return (
    <div>
      <div className="pizza-with-ingredients my-3">
        <div className="mx-4 flex justify-center flex-col items-center">
          <div className="flex flex-wrap justify-center">
            <NavLink
              to={{
                pathname: '/order/confirmation',
                state: {
                  dataForConfirmation,
                },
              }}
            >
              <button
                className="bg-yellow-800 hover:bg-red-600 text-gray-200 text-sm sm:text-base font-bold py-2 px-2 sm:px-4 border border-gray-400 rounded shadow inline-flex m-1 sm:m-8"
                type="button"
              >
                <img src={pizzabox} alt="pizzabox" className="h-6 w-6 mr-2" />
                Commander
              </button>
            </NavLink>
            <button
              className="bg-red-500 hover:bg-red-900 text-gray-200 text-sm sm:text-base font-bold py-2 px-2 sm:px-4 border border-gray-400 rounded shadow inline-flex m-1 sm:m-8"
              type="button"
              onClick={handleEmptyingPizza}
            >
              <img src={emptyPizza} alt="emptyPizza" className="h-6 w-6 mr-2" />
              Vider la pizza
            </button>
          </div>{' '}
          <PizzaChange
            chosenIngredientsList={chosenIngredientsList}
            totalPrice={totalPrice}
          />
        </div>
        {error && <h3>{error}</h3>}
        {loadingIngredientsListDB ? (
          <div className="flex justify-center pt-3">Loading in progress</div>
        ) : (
          <ul className="ingredientsList">
            {ingredientsKcal
              .filter((ingredient) => ingredient.category === 'Ingredient')
              .map((ingr) => (
                <li key={ingr.id} className="ingredient">
                  <div className="mb-1 font-bold text-2xl text-center">
                    {ingr.name}
                  </div>
                  <button
                    type="button"
                    className="m-auto w-full"
                    onClick={() =>
                      handleChangeQuantity(ingr.id, ingr.name, 'add')
                    }
                  >
                    <img
                      id={ingr.id}
                      src={requestImageFile(`./${ingr.imgsrc}`).default}
                      alt={ingr.name}
                      className="sm:w-24 w-16 m-auto"
                    />
                  </button>
                  <div className="mt-1 font-bold text-l text-center">
                    1 Portion :
                  </div>
                  <div className="text-l text-center">
                    {`${ingr.serving} g - ${
                      (ingr.kcal100 * ingr.serving) / 100
                    } kcal - ${ingr.price} €`}
                  </div>

                  <div className="text-l text-center">
                    <button
                      id={ingr.id}
                      type="button"
                      className="bg-green-500 text-white font-bold w-8 h-8 m-2 rounded"
                      onClick={() =>
                        handleChangeQuantity(ingr.id, ingr.name, 'add')
                      }
                    >
                      +
                    </button>
                    {setServingQuantity(ingr.id)}
                    portion(s)
                    <button
                      type="button"
                      className="bg-red-500 text-white font-bold w-8 h-8 m-2 rounded"
                      onClick={() =>
                        handleChangeQuantity(ingr.id, ingr.name, 'remove')
                      }
                    >
                      -
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
