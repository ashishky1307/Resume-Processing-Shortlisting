import streamlit as st
import os
from dotenv import load_dotenv
from groq import Groq
import PyPDF2

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def extract_text_from_pdf(file):
    """Extracts text from a PDF file."""
    pdf_reader = PyPDF2.PdfReader(file)
    text = ""
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text()
    return text

def extract_resume_data(resume_text):
    """Extracts structured data from resume text using Groq API."""
    prompt = f"""Extract the following information from the resume text provided below:
    - Full Name
    - Email Address
    - Phone Number
    - Location (City, State/Country)
    - Education (Degree, Institution, Year) - list all
    - Work Experience (Company, Position, Duration) - list all
    - Skills (Technical and Soft Skills) - list all
    - Years of Experience (calculated or extracted)

    Resume Text:
    {resume_text}

    Return the extracted information in a structured format. If a field is not found, indicate "Not found".
    """

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama3-70b-8192", # Corrected model name
    )
    return chat_completion.choices[0].message.content

# Streamlit App
st.title("Resume Processing System")

uploaded_file = st.file_uploader("Upload a resume (PDF)", type="pdf")

if uploaded_file is not None:
    st.write("File Uploaded Successfully!")

    # Extract text from PDF
    with st.spinner("Extracting text from PDF..."):
        resume_text = extract_text_from_pdf(uploaded_file)
    st.subheader("Extracted Text:")
    st.text_area("Resume Content", resume_text, height=300)

    # Process with Groq
    if st.button("Extract Information"):
        if not os.environ.get("GROQ_API_KEY") or os.environ.get("GROQ_API_KEY") == "YOUR_GROQ_API_KEY":
            st.error("GROQ_API_KEY not configured. Please set it in the .env file.")
        elif not resume_text.strip():
            st.warning("The extracted text is empty. Cannot process.")
        else:
            with st.spinner("Extracting information using Groq LLaMA-3..."):
                extracted_data = extract_resume_data(resume_text)
            st.subheader("Extracted Information:")
            st.markdown(extracted_data)
else:
    st.info("Please upload a PDF file to begin.")

