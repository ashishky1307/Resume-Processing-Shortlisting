import uvicorn

if __name__ == "__main__":
    print("Starting Resume Processing API server...")
    print("Access the API documentation at: http://localhost:8000/docs")
    print("Access the frontend at: http://localhost:8000 (if you've configured static files)")
    print("To use the HTML frontend directly, open the index.html file in your browser")
    print("Press Ctrl+C to stop the server")
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
