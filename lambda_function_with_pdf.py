import json
import boto3
import os
from datetime import datetime
import urllib.request
import urllib.error

# PDF extraction library
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("WARNING: PyPDF2 not installed, PDF extraction disabled")

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def extract_text_from_pdf(file_path):
    """
    Extract text from PDF file using PyPDF2
    """
    if not PDF_SUPPORT:
        return f"[PDF extraction not available - PyPDF2 library not installed]"
    
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            print(f"PDF has {num_pages} pages")
            
            # Extract text from each page
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                text += page_text + "\n"
                print(f"Extracted {len(page_text)} characters from page {page_num + 1}")
        
        print(f"Total extracted text: {len(text)} characters")
        return text.strip()
    
    except Exception as e:
        print(f"Error extracting PDF: {str(e)}")
        return f"[PDF extraction failed: {str(e)}]"

def extract_text_from_document(file_path):
    """
    Extract text from document (TXT or PDF)
    """
    file_extension = os.path.splitext(file_path)[1].lower()
    
    # Handle PDF files
    if file_extension == '.pdf':
        print(f"Processing PDF file: {file_path}")
        return extract_text_from_pdf(file_path)
    
    # Handle text files
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
            if text.strip():
                print(f"Successfully read as text file")
                return text
    except Exception as e:
        print(f"Failed to read as text file: {str(e)}")
        return f"[Failed to extract text: {str(e)}]"

def chunk_text(text, chunk_size=500, overlap=50):
    """
    Split text into smaller chunks for embedding
    
    Args:
        text: The text to split (input text)
        chunk_size: Maximum characters per chunk (default 500)
        overlap: Characters to overlap between chunks (default 50)
    
    Returns:
        List of text chunks (list of strings)
    """
    # Check if text is empty
    if not text or len(text) == 0:
        return []
    
    chunks = []
    start = 0
    text_length = len(text)

    # Loop through text and create chunks
    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]

        # Try to break at sentence boundary (not in middle of sentence)
        if end < text_length:
            # Find last sentence ending in this chunk
            last_period = chunk.rfind('.')
            last_question = chunk.rfind('?')
            last_exclamation = chunk.rfind('!')
            
            # Get the position of last sentence ending
            last_sentence = max(last_period, last_question, last_exclamation)
            
            # If we found a good break point (not too early in chunk)
            if last_sentence > chunk_size * 0.5:
                chunk = chunk[:last_sentence + 1]
                end = start + last_sentence + 1
        
        chunks.append(chunk.strip())
        
        # Move to next chunk with overlap
        start = end - overlap
    
    print(f"Split text into {len(chunks)} chunks")
    return chunks

def generate_embeddings(text_chunks, document_id):
    """
    Generate embeddings for text chunks using OpenAI API
    
    Args:
        text_chunks: List of text chunks (from chunk_text function)
        document_id: Document ID for reference
    
    Returns:
        List of dictionaries containing chunk text and embedding vector
    """
    # Get OpenAI API key from environment variable
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    print(f"Generating embeddings for {len(text_chunks)} chunks...")
    
    embeddings_data = []

    # Loop through each chunk and generate embedding
    for i, chunk in enumerate(text_chunks):
        try:
            # Prepare API request
            url = "https://api.openai.com/v1/embeddings"
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            data = {
                "input": chunk,
                "model": "text-embedding-3-small"
            }
            # Make HTTP POST request to OpenAI
            request = urllib.request.Request(
                url,
                data=json.dumps(data).encode('utf-8'),
                headers=headers,
                method='POST'
            )

            # Send request and read response
            with urllib.request.urlopen(request, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
                embedding = result['data'][0]['embedding']

            # Store chunk data with embedding
            embeddings_data.append({
                'chunk_id': f"{document_id}_chunk_{i}",
                'document_id': document_id,
                'chunk_index': i,
                'text': chunk,
                'embedding': embedding,
                'embedding_dimension': len(embedding)
            })
            print(f"Generated embedding for chunk {i+1}/{len(text_chunks)} (dimension: {len(embedding)})")
    
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f"OpenAI API error for chunk {i}: {e.code} - {error_body}")
            raise
        except Exception as e:
            print(f"Error generating embedding for chunk {i}: {str(e)}")
            raise

    print(f"Successfully generated {len(embeddings_data)} embeddings")
    return embeddings_data

def save_embeddings_to_dynamodb(embeddings_data, file_name, uploaded_by):
    """
    Save embeddings to DynamoDB table
    
    Args:
        embeddings_data: List of embedding dictionaries (from generate_embeddings)
        file_name: Original file name
        uploaded_by: User ID who uploaded the document
    """
    try:
        # Get reference to DynamoDB table
        table = dynamodb.Table('DocumentEmbeddings')
        
        print(f"Saving {len(embeddings_data)} embeddings to DynamoDB...")
        
        # Loop through each embedding and save to DynamoDB
        for embedding_item in embeddings_data:
            # Prepare item for DynamoDB
            item = {
                'chunk_id': embedding_item['chunk_id'],
                'document_id': embedding_item['document_id'],
                'chunk_index': embedding_item['chunk_index'],
                'text': embedding_item['text'],
                'embedding': json.dumps(embedding_item['embedding']),  # Convert to JSON string
                'file_name': file_name,
                'uploaded_by': uploaded_by,
                'created_at': datetime.now().isoformat(),
                'embedding_model': 'text-embedding-3-small',
                'embedding_dimension': embedding_item['embedding_dimension']
            }
            # Save to DynamoDB
            table.put_item(Item=item)
            print(f"Saved chunk {embedding_item['chunk_index']} to DynamoDB")
        
        print(f"All embeddings saved successfully")
    
    except Exception as e:
        print(f"Error saving embeddings to DynamoDB: {str(e)}")
        raise

def lambda_handler(event, context):
    """
    Process document when SNS notification is received
    This is the main entry point of Lambda function
    """
    print("=== Document Processing Lambda Started ===")
    print(f"Event received: {json.dumps(event)}")
    try:
        for record in event['Records']:
            if record['EventSource'] == 'aws:sns':
                # Get the SNS message (it's a JSON string)
                sns_message =  json.loads(record['Sns']['Message'])
                print(f"SNS Message: {json.dumps(sns_message)}")

                # Extract document information from the message
                document_id = sns_message.get('documentId')
                s3_bucket = sns_message.get('s3Bucket')
                s3_key = sns_message.get('s3Key')
                file_name = sns_message.get('fileName')
                uploaded_by = sns_message.get('uploadedBy')

                print(f"Processing document: {file_name}")
                print(f"Document ID: {document_id}")
                print(f"S3 Location: s3://{s3_bucket}/{s3_key}")

                # Download file from S3
                local_file_path = f'/tmp/{file_name}'
                print(f"Downloading file to: {local_file_path}")

                try:
                    s3_client.download_file(s3_bucket, s3_key, local_file_path)
                    print("File downloaded successfully")
                    
                    file_size = os.path.getsize(local_file_path)
                    print(f"File size: {file_size} bytes ({file_size / 1024:.2f} KB)")
                except Exception as download_error:
                    print(f"Failed to download file from S3: {str(download_error)}")
                    raise
                # Extract text from document
                print("Extracting text from document...")
                extracted_text = extract_text_from_document(local_file_path)
                print(f"Extracted {len(extracted_text)} characters")

                preview_length = min(200, len(extracted_text))
                print(f"Preview: {extracted_text[:preview_length]}...")

                # Split text into chunks
                text_chunks = chunk_text(extracted_text, chunk_size=500, overlap=50)

                # Check if we have chunks to process
                if len(text_chunks) == 0:
                    print("WARNING: No text chunks to process")
                else:
                    # Generate embeddings for each chunk
                    print("\n=== Starting Embedding Generation ===")
                    embeddings_data = generate_embeddings(text_chunks, document_id)

                    # Save embeddings to DynamoDB
                    print("\n=== Saving to DynamoDB ===")
                    save_embeddings_to_dynamodb(embeddings_data, file_name, uploaded_by)

                    # Print success message
                    print(f"\n=== SUCCESS: Processed {len(embeddings_data)} embeddings ===")
                    
                # Clean up temporary file
                try:
                    os.remove(local_file_path)
                    print(f"Temporary file '{local_file_path}' removed.")
                except OSError as e:
                    print(f"Error removing temporary file: {str(e)}")
        return {
            'statusCode': 200,
            'body': json.dumps('Document processing completed successfully')
        }
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'body': json.dumps(f'Error processing document: {str(e)}')
        }

