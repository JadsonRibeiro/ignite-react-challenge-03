import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      const storagedCartData = JSON.parse(storagedCart);
      setCart(storagedCartData);
      return;
    }
  }, []);

  const addProduct = async (productId: number) => {
    try {
      const productIndexOnCart = cart.findIndex(product => product.id === productId);

      // Product dont exist on cart
      if(productIndexOnCart < 0) {
        const { data: product } = await api.get<Product>(`products/${productId}`);

        const { data: stock } = await api.get<Stock>(`stock/${productId}`);

        if(stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = [...cart, { ...product, amount: 1 }];

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        const { data: stock } = await api.get<Stock>(`stock/${productId}`);

        const product = cart[productIndexOnCart];

        if(stock.amount < (product.amount + 1)) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(product => {
          if(product.id === productId) {
            product.amount = product.amount + 1;
          }

          return product;
        })

        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const storagedCartData = cart;

      const productIndexOnCart = storagedCartData.findIndex((storagedProduct) => storagedProduct.id === productId);

      if(productIndexOnCart < 0)
        return toast.error('Erro na remo????o do produto');
      
      storagedCartData.splice(productIndexOnCart, 1);
      
      setCart(storagedCartData);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(storagedCartData));
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if(stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const storagedCartData = cart;
      const productIndexOnCart = storagedCartData.findIndex((storagedProduct) => storagedProduct.id === productId);

      if(productIndexOnCart < 0) {
        toast.error('Erro na altera????o de quantidade do produto');
        return;
      } else {
        const newCart = cart.map(product => {
          if(product.id === productId) {
            product.amount = amount;
          }

          return product;
        })

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch (e) {
      toast.error('Erro na altera????o de quantidade do produto');
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
