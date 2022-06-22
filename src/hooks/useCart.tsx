import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import { AxiosResponse } from 'axios';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const { data: stockAvailable} = await api.get(`/stock/${productId}`);
      if (stockAvailable.amount <= 1) {
        return toast.error('Quantidade solicitada fora de estoque');
      }  

      const cartClone = [...cart];
      const alreadyAdded = cartClone.find(p => p.id === productId);
      if (alreadyAdded) {
        alreadyAdded.amount++;
        setCart(cartClone);
        return localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartClone));
      }

      const { data: product }: AxiosResponse<Product> = await api.get(`/products/${productId}`);
      product.amount = 1;
      cartClone.push(product);
      setCart(cartClone);
      return localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartClone));
    } catch (error: any) {
      // TODO
      return toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      // TODO

      const cartClone = [...cart];
      const product = cartClone.find(c => c.id === productId);
      if (!product) {
        throw new Error();
      }
      const productIndex = cartClone.findIndex(p => p.id === productId);
      cartClone.splice(productIndex, 1);
      
      localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cartClone]));
      setCart([...cartClone]);
    } catch {
      // TODO
      return toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount < 1) return;
      const { data: stockAvailable} = await api.get(`/stock/${productId}`); 
      const cloneCart = [...cart];
      const product = cloneCart.find(item => item.id === productId);
      if (!product) throw Error();

      if (stockAvailable.amount <= 1 && product.amount < amount) {
        return toast.error('Quantidade solicitada fora de estoque')
      }

      product.amount = amount;
      setCart(cloneCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cloneCart))
    } catch {
      // TODO
      return toast.error('Erro na alteração de quantidade do produto');
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
