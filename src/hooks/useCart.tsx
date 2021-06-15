import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
      let cartSnapshot = [...cart];
      const product = cart.find(findProduct(productId));
      const { data: stock } = await api.get(`stock/${productId}`)

      const productAmount = product ? product.amount : 0;
      const nextAmount = productAmount + 1;

      if (nextAmount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (product) {
        cartSnapshot = cartSnapshot.map(item => item.id === productId ? { ...item, amount: nextAmount } : item)
        setCart((prevState) =>
          prevState.map((item) =>
            item.id === productId ? { ...item, amount: nextAmount } : item,
          ),
        )
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartSnapshot))
      } else {
        const { data: updatedProduct } = await api.get(`products/${productId}`)
        cartSnapshot.push({ ...updatedProduct, amount: 1 })
        setCart(prevState => [...prevState, { ...updatedProduct, amount: 1 }])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartSnapshot))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let cartSnapshot = [...cart];
      const productExists = cartSnapshot.some(findProduct(productId))

      if (productExists) {
        cartSnapshot = cartSnapshot.filter(item => item.id !== productId)
        setCart(prevState => prevState.filter(product => product.id !== productId))
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartSnapshot))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return
      }

      let cartSnapshot = [...cart]
      const product = cart.find(findProduct(productId));
      const { data: stock } = await api.get(`stock/${productId}`)

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (product) {
        cartSnapshot = cartSnapshot.map((item) =>
          item.id === productId ? { ...item, amount: amount } : item,
        );
        setCart((prevState) =>
          prevState.map((item) =>
            item.id === productId ? { ...item, amount: amount } : item,
          ),
        )
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartSnapshot))
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
