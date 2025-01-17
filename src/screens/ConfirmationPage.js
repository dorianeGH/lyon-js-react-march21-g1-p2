import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../APIClient';

export default function ConfirmationPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showData, setShowData] = useState(null);
  const location = useLocation();
  const dataForConfirmation =
    location.state != null ? location.state.dataForConfirmation : null;

  // Adding this order data to the database
  useEffect(() => {
    if (dataForConfirmation) {
      API.post('/orders', dataForConfirmation)
        .then(() => {
          setSuccess(true);
        })
        .catch(() => {
          setError('Cannot record this order.');
        });

      setShowData(
        <tbody>
          <tr>
            <td>
              {Object.entries(JSON.parse(dataForConfirmation.ingredients))
                .reduce(
                  (listOfIngredients, ingredient) =>
                    `${listOfIngredients} ${ingredient[0]},`,
                  ''
                )
                .replace(/,\s*$/, '')}
            </td>
            <td>{dataForConfirmation.price} €</td>
          </tr>
        </tbody>
      );
    }
  }, []);

  return (
    <>
      <h2 className="text-3xl text-center font-bold m-3">
        Récapitulatif de votre commande
      </h2>
      <table id="orders-recap">
        <thead>
          <tr>
            <th>Ingrédients</th>
            <th>Prix total</th>
          </tr>
        </thead>
        {showData}
      </table>

      {error && <h3 className="text-2xl font-bold m-3">{error}</h3>}
      {success && (
        <h3 className="text-2xl font-bold m-3">
          Votre commande a bien été enregistrée !
        </h3>
      )}
    </>
  );
}
