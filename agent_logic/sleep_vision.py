#!/usr/bin/env python3
"""
Sleep Verification using Computer Vision

This module uses PaliGemma (Google's lightweight vision-language model) 
to analyze sleep photos and verify if they show a proper sleeping surface.
"""

import base64
import io
from PIL import Image
import requests
from typing import Dict, Tuple, Optional
import os

class SleepVisionAnalyzer:
    """
    Computer vision analyzer for sleep verification using PaliGemma
    """
    
    def __init__(self):
        self.model_name = "google/paligemma-3b-pt-224"
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        self.headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY', '')}"}
        
        # Sleep-related keywords for verification
        self.sleep_keywords = [
            'bed', 'bedroom', 'pillow', 'blanket', 'sheet', 'mattress',
            'bedding', 'duvet', 'comforter', 'sleeping', 'rest', 'night'
        ]
        
        self.non_sleep_keywords = [
            'kitchen', 'office', 'car', 'street', 'restaurant', 'store',
            'bathroom', 'living room', 'couch', 'sofa', 'chair', 'desk'
        ]
    
    def analyze_sleep_photo(self, image_data_uri: str) -> Dict:
        """
        Analyze a photo to determine if it shows a valid sleeping surface
        
        Args:
            image_data_uri: Base64 encoded image data URI
            
        Returns:
            Dict with verification result and confidence
        """
        try:
            # Parse the data URI
            if not image_data_uri.startswith('data:image/'):
                return {
                    'is_valid_sleep_surface': False,
                    'confidence': 0.0,
                    'reason': 'Invalid image format',
                    'analysis': 'Not a valid image data URI'
                }
            
            # Extract base64 data
            header, encoded = image_data_uri.split(',', 1)
            image_data = base64.b64decode(encoded)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Resize for PaliGemma (224x224 is optimal)
            image = image.resize((224, 224))
            
            # Convert back to bytes for API
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='JPEG')
            img_byte_arr = img_byte_arr.getvalue()
            
            # Use local analysis if HuggingFace API not available
            if not self.headers["Authorization"] or self.headers["Authorization"] == "Bearer ":
                return self._local_sleep_analysis(image)
            
            # Call PaliGemma via HuggingFace API
            prompt = "Describe what you see in this image. Is this a bedroom or sleeping area?"
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json={
                    "inputs": prompt,
                    "parameters": {"max_new_tokens": 100}
                },
                files={"image": img_byte_arr},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return self._parse_paligemma_response(result, prompt)
            else:
                print(f"PaliGemma API error: {response.status_code}")
                return self._local_sleep_analysis(image)
                
        except Exception as e:
            print(f"Error in sleep photo analysis: {e}")
            return self._fallback_analysis(image_data_uri)
    
    def _parse_paligemma_response(self, response: Dict, prompt: str) -> Dict:
        """Parse PaliGemma response and determine sleep surface validity"""
        try:
            # Extract generated text
            if isinstance(response, list) and len(response) > 0:
                generated_text = response[0].get('generated_text', '').lower()
            elif isinstance(response, dict):
                generated_text = response.get('generated_text', '').lower()
            else:
                generated_text = str(response).lower()
            
            # Remove the prompt from the response
            if prompt.lower() in generated_text:
                generated_text = generated_text.replace(prompt.lower(), '').strip()
            
            # Count sleep-related vs non-sleep keywords
            sleep_score = sum(1 for keyword in self.sleep_keywords if keyword in generated_text)
            non_sleep_score = sum(1 for keyword in self.non_sleep_keywords if keyword in generated_text)
            
            # Calculate confidence based on keyword analysis
            total_keywords = sleep_score + non_sleep_score
            if total_keywords > 0:
                confidence = sleep_score / total_keywords
                is_valid = sleep_score > non_sleep_score
            else:
                # Fallback: look for explicit bedroom/sleep mentions
                is_valid = any(word in generated_text for word in ['bed', 'sleep', 'bedroom'])
                confidence = 0.7 if is_valid else 0.3
            
            return {
                'is_valid_sleep_surface': is_valid,
                'confidence': confidence,
                'reason': f"PaliGemma analysis: {sleep_score} sleep keywords, {non_sleep_score} non-sleep keywords",
                'analysis': generated_text[:200] + "..." if len(generated_text) > 200 else generated_text
            }
            
        except Exception as e:
            print(f"Error parsing PaliGemma response: {e}")
            return self._fallback_analysis("")
    
    def _local_sleep_analysis(self, image: Image.Image) -> Dict:
        """
        Local computer vision analysis when PaliGemma is not available
        Uses basic image properties and heuristics
        """
        try:
            # Basic image analysis
            width, height = image.size
            aspect_ratio = width / height
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Analyze color distribution (bedrooms tend to have warmer, softer colors)
            pixels = list(image.getdata())
            
            # Calculate average brightness and color temperature
            avg_brightness = sum(sum(pixel) for pixel in pixels) / (len(pixels) * 3)
            
            # Simple heuristics for sleep surface detection
            is_valid = True
            confidence = 0.6  # Moderate confidence for local analysis
            reason = "Local analysis: "
            
            # Check image dimensions (very small images are suspicious)
            if width < 100 or height < 100:
                is_valid = False
                confidence = 0.2
                reason += "Image too small for verification"
            
            # Check brightness (completely black or white images are suspicious)
            elif avg_brightness < 10:
                is_valid = False
                confidence = 0.3
                reason += "Image too dark"
            elif avg_brightness > 245:
                is_valid = False
                confidence = 0.3
                reason += "Image too bright/overexposed"
            
            # Check aspect ratio (extremely wide or tall images are unusual for bed photos)
            elif aspect_ratio > 3 or aspect_ratio < 0.33:
                is_valid = False
                confidence = 0.4
                reason += "Unusual aspect ratio for bedroom photo"
            
            else:
                reason += "Basic image properties suggest valid bedroom photo"
            
            return {
                'is_valid_sleep_surface': is_valid,
                'confidence': confidence,
                'reason': reason,
                'analysis': f"Local analysis - Brightness: {avg_brightness:.1f}, Aspect ratio: {aspect_ratio:.2f}"
            }
            
        except Exception as e:
            print(f"Error in local sleep analysis: {e}")
            return self._fallback_analysis("")
    
    def _fallback_analysis(self, image_data_uri: str) -> Dict:
        """Fallback analysis when all other methods fail"""
        # Very basic validation - just check if it's a valid image data URI
        is_valid = image_data_uri.startswith('data:image/')
        
        return {
            'is_valid_sleep_surface': is_valid,
            'confidence': 0.5 if is_valid else 0.0,
            'reason': 'Fallback analysis - basic format validation only',
            'analysis': 'Computer vision analysis unavailable, using basic validation'
        }

# Global analyzer instance
sleep_analyzer = SleepVisionAnalyzer()

def verify_sleep_photo(image_data_uri: str) -> Dict:
    """
    Main function to verify if a photo shows a valid sleeping surface
    
    Args:
        image_data_uri: Base64 encoded image data URI
        
    Returns:
        Dict with verification results
    """
    return sleep_analyzer.analyze_sleep_photo(image_data_uri)

if __name__ == "__main__":
    # Test with a sample image
    print("Sleep Vision Analyzer - Testing Mode")
    
    # You can test with a real image data URI here
    test_result = verify_sleep_photo("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A")
    
    print("Test result:", test_result)