import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import './App.css'; // Import the CSS file

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );

    // Sort notes by creationDate (assuming notes have a creationDate field)
    notes.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));

    setNotes(notes);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);

    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
      image: form.get("image").name,
    });

    if (newNote.image) {
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${newNote.image}`,
        data: form.get("image"),
      }).result;
    }

    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id }) {
    await client.models.Note.delete({ id });
    fetchNotes();
  }

  return (
    <div className="app-container">
      <Authenticator
        components={{
          SignIn: {
            Header() {
              return (
                <Flex
                  direction="column"
                  alignItems="center"
                  margin="1rem 0"
                >
                  <Heading level={1} textAlign="center">
                    CloudNotes
                  </Heading>
                </Flex>
              );
            },
          },
        }}
      >
        {({ signOut }) => (
          <Flex
            className="App"
            justifyContent="center"
            alignItems="center"
            direction="column"
            width="70%"
            margin="0 auto"
          >
            <Heading level={1}>New Note</Heading>
            <View as="form" margin="3rem 0" onSubmit={createNote}>
              <Flex
                direction="column"
                justifyContent="center"
                gap="3rem"
                padding="3rem"
                border="4px solid #FFFFFF"
                borderRadius="5%"
              >
                <TextField
                  className="custom-placeholder"
                  name="name"
                  placeholder="Note Name"
                  label="Note Name"
                  labelHidden
                  variation="quiet"
                  required
                />
                <TextField
                  className="custom-placeholder"
                  name="description"
                  placeholder="Note Description"
                  label="Note Description"
                  labelHidden
                  variation="quiet"
                  required
                />
                <View
                  name="image"
                  as="input"
                  type="file"
                  alignSelf={"end"}
                  accept="image/png, image/jpeg, video/mp4, video/mov, video/avi, video/mkv, video/webm"
                />
                <Button
                  type="submit"
                  variation="primary"
                  style={{
                    backgroundColor: "#047d95",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    borderWidth: '3px',
                    borderColor: '#000000',
                    borderStyle: 'solid',
                  }}
                >
                  Create Note
                </Button>
              </Flex>
            </View>
            <Divider />
            <Heading level={1}>My Notes</Heading>
            <Grid
              margin="3rem 0"
              autoFlow="column"
              justifyContent="center"
              gap="2rem"
              alignContent="center"
            >
              {notes.map((note) => (
                <Flex
                  key={note.id || note.name}
                  direction="column"
                  justifyContent="center"
                  alignItems="center"
                  gap="2rem"
                  border="4px solid #FFFFFF"
                  padding="2rem"
                  borderRadius="0%"
                  className="box"
                >
                  <View>
                    <Heading level="3">{note.name}</Heading>
                  </View>
                  <Text fontStyle="italic">{note.description}</Text>
                  {note.image && (
                    <Image
                      src={note.image}
                      alt={`visual aid for ${note.name}`}
                      style={{ width: 400 }}
                    />
                  )}
                  <Button
                    variation="destructive"
                    onClick={() => deleteNote(note)}
                    style={{
                      backgroundColor: '#FF0000',
                      borderWidth: '3px',
                      borderColor: '#000000',
                      borderStyle: 'solid',
                      color: "#FFFFFF",
                    }}
                  >
                    Delete note
                  </Button>
                </Flex>
              ))}
            </Grid>
            <Button
              onClick={signOut}
              style={{
                backgroundColor: '#047d95',
                borderWidth: '3px',
                borderColor: '#000000',
                borderStyle: 'solid',
                color: "#FFFFFF",
              }}
            >
              Sign Out
            </Button>
          </Flex>
        )}
      </Authenticator>
    </div>
  );
}
