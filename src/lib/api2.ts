import axios, { AxiosResponse, AxiosError } from 'axios';
import { Order } from '../types/order';
import { Rider } from '../types/order';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://ollanbackend.vercel.app/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchAdminOrders = async (): Promise<Order[]> => {
  try {
    const response: AxiosResponse<Order[]> = await api.get('/orders/admin-orders');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('fetchAdminOrders error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, action: 'accept' | 'reject'): Promise<Order> => {
  try {
    const response: AxiosResponse<{ message: string; order: Order }> = await api.post('/orders/update-order-status', { orderId, action });
    return response.data.order;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('updateOrderStatus error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const fetchRiderOrders = async (): Promise<Order[]> => {
  try {
    const response: AxiosResponse<Order[]> = await api.get('/orders/rider-orders');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('fetchRiderOrders error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const updateDeliveryStatus = async (orderId: string, deliveryStatus: 'en_route' | 'delivered'): Promise<Order> => {
  try {
    const response: AxiosResponse<{ message: string; order: Order }> = await api.post('/orders/update-delivery-status', { orderId, deliveryStatus });
    return response.data.order;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('updateDeliveryStatus error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const fetchUserOrders = async (): Promise<Order[]> => {
  try {
    const response: AxiosResponse<Order[]> = await api.get('/orders/my-orders');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('fetchUserOrders error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    const response: AxiosResponse<Order[]> = await api.get('/orders/all');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('fetchAllOrders error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const fetchRiders = async (): Promise<Rider[]> => {
  try {
    const response: AxiosResponse<Rider[]> = await api.get('/orders/riders');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('fetchRiders error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const assignRider = async (orderId: string, riderId: string): Promise<Order> => {
  try {
    const response: AxiosResponse<{ message: string; order: Order }> = await api.post('/orders/assign-order', { orderId, riderId });
    return response.data.order;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('assignRider error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const verifyPayment = async (orderId: string, paymentDetails: string): Promise<Order> => {
  try {
    const response: AxiosResponse<{ message: string; order: Order }> = await api.post('/orders/verify-payment', { orderId, paymentDetails });
    return response.data.order;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('verifyPayment error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};

export const shareTrackingLink = async (orderId: string): Promise<{ message: string; trackingUrl: string }> => {
  try {
    const response: AxiosResponse<{ message: string; trackingUrl: string }> = await api.post('/orders/share-tracking', { orderId });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('shareTrackingLink error:', {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });
    throw error;
  }
};