import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const findProduct = (productId: number) => (item: Product) => item.id === productId;

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(findProduct(productId));
      const { data: stock } = await api.get(`stock/${productId}`)

      const productAmount = product ? product.amount : 0;
      const nextAmount = productAmount + 1;

      console.log('stock:', stock.amount)
      if (nextAmount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (product) {
        setCart((prevState) =>
          prevState.map((item) =>
            item.id === productId ? { ...item, amount: nextAmount } : item,
          ),
        )
      } else {
        const { data: updatedProduct } = await api.get(`products/${productId}`)
        setCart(prevState => [...prevState, { ...updatedProduct, amount: 1 }])
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
